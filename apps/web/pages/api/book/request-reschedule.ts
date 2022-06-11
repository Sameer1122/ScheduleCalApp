import { BookingStatus, User, Booking, Attendee, BookingReference } from "@prisma/client";
import dayjs from "dayjs";
import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import type { TFunction } from "next-i18next";
import { z, ZodError } from "zod";

import { getCalendar } from "@calcom/core/CalendarManager";
import EventManager from "@calcom/core/EventManager";
import { CalendarEventBuilder } from "@calcom/core/builders/CalendarEvent/builder";
import { CalendarEventDirector } from "@calcom/core/builders/CalendarEvent/director";
import { deleteMeeting } from "@calcom/core/videoClient";
import { getTranslation } from "@calcom/lib/server/i18n";
import { Person } from "@calcom/types/Calendar";

import { sendRequestRescheduleEmail } from "@lib/emails/email-manager";
import prisma from "@lib/prisma";

export type RescheduleResponse = Booking & {
  attendees: Attendee[];
};
export type PersonAttendeeCommonFields = Pick<
  User,
  "id" | "email" | "name" | "locale" | "timeZone" | "username"
>;

const rescheduleSchema = z.object({
  bookingId: z.string(),
  rescheduleReason: z.string().optional(),
});

const findUserOwnerByUserId = async (userId: number) => {
  return await prisma.user.findUnique({
    rejectOnNotFound: true,
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      timeZone: true,
      locale: true,
      credentials: true,
      destinationCalendar: true,
    },
  });
};

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse
): Promise<RescheduleResponse | NextApiResponse | void> => {
  const session = await getSession({ req });
  const {
    bookingId,
    rescheduleReason: cancellationReason,
  }: { bookingId: string; rescheduleReason: string; cancellationReason: string } = req.body;
  let userOwner: Awaited<ReturnType<typeof findUserOwnerByUserId>>;
  try {
    if (session?.user?.id) {
      userOwner = await findUserOwnerByUserId(session?.user.id);
    } else {
      return res.status(501);
    }

    const bookingToReschedule = await prisma.booking.findFirst({
      select: {
        id: true,
        uid: true,
        title: true,
        startTime: true,
        endTime: true,
        eventTypeId: true,
        location: true,
        attendees: true,
        references: true,
      },
      rejectOnNotFound: true,
      where: {
        uid: bookingId,
        NOT: {
          status: {
            in: [BookingStatus.CANCELLED, BookingStatus.REJECTED],
          },
        },
      },
    });

    if (bookingToReschedule && bookingToReschedule.eventTypeId && userOwner) {
      const event = await prisma.eventType.findFirst({
        select: {
          title: true,
          users: true,
          schedulingType: true,
        },
        rejectOnNotFound: true,
        where: {
          id: bookingToReschedule.eventTypeId,
        },
      });
      await prisma.booking.update({
        where: {
          id: bookingToReschedule.id,
        },
        data: {
          rescheduled: true,
          cancellationReason,
          status: BookingStatus.CANCELLED,
          updatedAt: dayjs().toISOString(),
        },
      });

      const [mainAttendee] = bookingToReschedule.attendees;
      // @NOTE: Should we assume attendees language?
      const tAttendees = await getTranslation(mainAttendee.locale ?? "en", "common");
      const usersToPeopleType = (
        users: PersonAttendeeCommonFields[],
        selectedLanguage: TFunction
      ): Person[] => {
        return users?.map((user) => {
          return {
            email: user.email || "",
            name: user.name || "",
            username: user?.username || "",
            language: { translate: selectedLanguage, locale: user.locale || "en" },
            timeZone: user?.timeZone,
          };
        });
      };

      const userOwnerTranslation = await getTranslation(userOwner.locale ?? "en", "common");
      const [userOwnerAsPeopleType] = usersToPeopleType([userOwner], userOwnerTranslation);

      const builder = new CalendarEventBuilder();
      builder.init({
        title: bookingToReschedule.title,
        type: event.title,
        startTime: bookingToReschedule.startTime.toISOString(),
        endTime: bookingToReschedule.endTime.toISOString(),
        attendees: usersToPeopleType(
          // username field doesn't exists on attendee but could be in the future
          bookingToReschedule.attendees as unknown as PersonAttendeeCommonFields[],
          tAttendees
        ),
        organizer: userOwnerAsPeopleType,
      });

      const director = new CalendarEventDirector();
      director.setBuilder(builder);
      director.setExistingBooking(bookingToReschedule as unknown as Booking);
      director.setCancellationReason(cancellationReason);
      await director.buildForRescheduleEmail();

      // Handling calendar and videos cancellation
      // This can set previous time as available, until virtual calendar is done
      const credentialsMap = new Map();
      userOwner.credentials.forEach((credential) => {
        credentialsMap.set(credential.type, credential);
      });
      const bookingRefsFiltered: BookingReference[] = bookingToReschedule.references.filter(
        (ref) => !!credentialsMap.get(ref.type)
      );
      bookingRefsFiltered.forEach((bookingRef) => {
        if (bookingRef.uid) {
          if (bookingRef.type.endsWith("_calendar")) {
            const calendar = getCalendar(credentialsMap.get(bookingRef.type));

            return calendar?.deleteEvent(bookingRef.uid, builder.calendarEvent);
          } else if (bookingRef.type.endsWith("_video")) {
            return deleteMeeting(credentialsMap.get(bookingRef.type), bookingRef.uid);
          }
        }
      });

      // Creating cancelled event as placeholders in calendars, remove when virtual calendar handles it
      const eventManager = new EventManager({
        credentials: userOwner.credentials,
        destinationCalendar: userOwner.destinationCalendar,
      });
      builder.calendarEvent.title = `Cancelled: ${builder.calendarEvent.title}`;
      await eventManager.updateAndSetCancelledPlaceholder(builder.calendarEvent, bookingToReschedule);

      // Send emails
      await sendRequestRescheduleEmail(builder.calendarEvent, {
        rescheduleLink: builder.rescheduleLink,
      });
    }

    return res.status(200).json(bookingToReschedule);
  } catch (error) {
    throw new Error("Error.request.reschedule");
  }
};

function validate(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<RescheduleResponse | NextApiResponse | void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method === "POST") {
      try {
        rescheduleSchema.parse(req.body);
      } catch (error) {
        if (error instanceof ZodError && error?.name === "ZodError") {
          return res.status(400).json(error?.issues);
        }
        return res.status(402);
      }
    } else {
      return res.status(405);
    }
    await handler(req, res);
  };
}

export default validate(handler);
