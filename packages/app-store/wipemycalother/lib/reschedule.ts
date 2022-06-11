import { BookingStatus, User, Booking, BookingReference } from "@prisma/client";
import dayjs from "dayjs";
import type { TFunction } from "next-i18next";

import { CalendarEventBuilder } from "@calcom/core/builders/CalendarEvent/builder";
import { CalendarEventDirector } from "@calcom/core/builders/CalendarEvent/director";
import logger from "@calcom/lib/logger";
import { getTranslation } from "@calcom/lib/server/i18n";
import prisma from "@calcom/prisma";
import { Person } from "@calcom/types/Calendar";

import { getCalendar } from "../../_utils/getCalendar";
import { sendRequestRescheduleEmail } from "./emailManager";
import EventManager from "./eventManager";
import { deleteMeeting } from "./videoClient";

type PersonAttendeeCommonFields = Pick<User, "id" | "email" | "name" | "locale" | "timeZone" | "username">;

const Reschedule = async (bookingUid: string, cancellationReason: string) => {
  const bookingToReschedule = await prisma.booking.findFirst({
    select: {
      id: true,
      uid: true,
      title: true,
      startTime: true,
      endTime: true,
      userId: true,
      eventTypeId: true,
      location: true,
      attendees: true,
      references: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          timeZone: true,
          locale: true,
          username: true,
          credentials: true,
          destinationCalendar: true,
        },
      },
    },
    rejectOnNotFound: true,
    where: {
      uid: bookingUid,
      NOT: {
        status: {
          in: [BookingStatus.CANCELLED, BookingStatus.REJECTED],
        },
      },
    },
  });

  if (bookingToReschedule && bookingToReschedule.eventTypeId && bookingToReschedule.user) {
    const userOwner = bookingToReschedule.user;
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
    try {
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
    } catch (error) {
      if (error instanceof Error) {
        logger.error(error.message);
      }
    }
    // Creating cancelled event as placeholders in calendars, remove when virtual calendar handles it
    try {
      const eventManager = new EventManager({
        credentials: userOwner.credentials,
        destinationCalendar: userOwner.destinationCalendar,
      });
      builder.calendarEvent.title = `Cancelled: ${builder.calendarEvent.title}`;
      await eventManager.updateAndSetCancelledPlaceholder(builder.calendarEvent, bookingToReschedule);
    } catch (error) {
      if (error instanceof Error) {
        logger.error(error.message);
      }
    }

    // Send emails
    try {
      await sendRequestRescheduleEmail(builder.calendarEvent, {
        rescheduleLink: builder.rescheduleLink,
      });
    } catch (error) {
      if (error instanceof Error) {
        logger.error(error.message);
      }
    }
    return true;
  }
};

export default Reschedule;
