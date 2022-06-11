import { Prisma } from "@prisma/client";
import dayjs from "dayjs";
import short from "short-uuid";
import { v5 as uuidv5 } from "uuid";

import { getTranslation } from "@calcom/lib/server/i18n";
import prisma from "@calcom/prisma";

import { CalendarEventClass } from "./class";

const translator = short();
const userSelect = Prisma.validator<Prisma.UserArgs>()({
  select: {
    id: true,
    email: true,
    name: true,
    username: true,
    timeZone: true,
    credentials: true,
    bufferTime: true,
    destinationCalendar: true,
    locale: true,
  },
});

type User = Prisma.UserGetPayload<typeof userSelect>;
type PersonAttendeeCommonFields = Pick<User, "id" | "email" | "name" | "locale" | "timeZone" | "username">;
interface ICalendarEventBuilder {
  calendarEvent: CalendarEventClass;
  eventType: Awaited<ReturnType<CalendarEventBuilder["getEventFromEventId"]>>;
  users: Awaited<ReturnType<CalendarEventBuilder["getUserById"]>>[];
  attendeesList: PersonAttendeeCommonFields[];
  teamMembers: Awaited<ReturnType<CalendarEventBuilder["getTeamMembers"]>>;
  rescheduleLink: string;
}

export class CalendarEventBuilder implements ICalendarEventBuilder {
  calendarEvent!: CalendarEventClass;
  eventType!: ICalendarEventBuilder["eventType"];
  users!: ICalendarEventBuilder["users"];
  attendeesList: ICalendarEventBuilder["attendeesList"] = [];
  teamMembers: ICalendarEventBuilder["teamMembers"] = [];
  rescheduleLink!: string;

  constructor() {
    this.reset();
  }

  private reset() {
    this.calendarEvent = new CalendarEventClass();
  }

  public init(initProps: CalendarEventClass) {
    this.calendarEvent = new CalendarEventClass(initProps);
  }

  public setEventType(eventType: ICalendarEventBuilder["eventType"]) {
    this.eventType = eventType;
  }

  public async buildEventObjectFromInnerClass(eventId: number) {
    const resultEvent = await this.getEventFromEventId(eventId);
    if (resultEvent) {
      this.eventType = resultEvent;
    }
  }

  public async buildUsersFromInnerClass() {
    if (!this.eventType) {
      throw new Error("exec BuildEventObjectFromInnerClass before calling this function");
    }
    let users = this.eventType.users;

    /* If this event was pre-relationship migration */
    if (!users.length && this.eventType.userId) {
      const eventTypeUser = await this.getUserById(this.eventType.userId);
      if (!eventTypeUser) {
        throw new Error("buildUsersFromINnerClass.eventTypeUser.notFound");
      }
      users.push(eventTypeUser);
    }
    this.users = users;
  }

  public buildAttendeesList() {
    // Language Function was set on builder init
    this.attendeesList = [
      ...(this.calendarEvent.attendees as unknown as PersonAttendeeCommonFields[]),
      ...this.teamMembers,
    ];
  }

  private async getUserById(userId: number) {
    let resultUser: User | null;
    try {
      resultUser = await prisma.user.findUnique({
        rejectOnNotFound: true,
        where: {
          id: userId,
        },
        ...userSelect,
      });
    } catch (error) {
      throw new Error("getUsersById.users.notFound");
    }
    return resultUser;
  }

  private async getEventFromEventId(eventTypeId: number) {
    let resultEventType;
    try {
      resultEventType = await prisma.eventType.findUnique({
        rejectOnNotFound: true,
        where: {
          id: eventTypeId,
        },
        select: {
          id: true,
          users: userSelect,
          team: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          slug: true,
          teamId: true,
          title: true,
          length: true,
          eventName: true,
          schedulingType: true,
          periodType: true,
          periodStartDate: true,
          periodEndDate: true,
          periodDays: true,
          periodCountCalendarDays: true,
          requiresConfirmation: true,
          userId: true,
          price: true,
          currency: true,
          metadata: true,
          destinationCalendar: true,
          hideCalendarNotes: true,
        },
      });
    } catch (error) {
      throw new Error("Error while getting eventType");
    }
    return resultEventType;
  }

  public async buildLuckyUsers() {
    if (!this.eventType && this.users && this.users.length) {
      throw new Error("exec buildUsersFromInnerClass before calling this function");
    }

    // @TODO: user?.username gets flagged as null somehow, maybe a filter before map?
    const filterUsernames = this.users.filter((user) => user && typeof user.username === "string");
    const userUsernames = filterUsernames.map((user) => user.username) as string[]; // @TODO: hack
    const users = await prisma.user.findMany({
      where: {
        username: { in: userUsernames },
        eventTypes: {
          some: {
            id: this.eventType.id,
          },
        },
      },
      select: {
        id: true,
        username: true,
        locale: true,
      },
    });

    const userNamesWithBookingCounts = await Promise.all(
      users.map(async (user) => ({
        username: user.username,
        bookingCount: await prisma.booking.count({
          where: {
            user: {
              id: user.id,
            },
            startTime: {
              gt: new Date(),
            },
            eventTypeId: this.eventType.id,
          },
        }),
      }))
    );
    const luckyUsers = this.getLuckyUsers(this.users, userNamesWithBookingCounts);
    this.users = luckyUsers;
  }

  private getLuckyUsers(
    users: User[],
    bookingCounts: {
      username: string | null;
      bookingCount: number;
    }[]
  ) {
    if (!bookingCounts.length) users.slice(0, 1);

    const [firstMostAvailableUser] = bookingCounts.sort((a, b) => (a.bookingCount > b.bookingCount ? 1 : -1));
    const luckyUser = users.find((user) => user.username === firstMostAvailableUser?.username);
    return luckyUser ? [luckyUser] : users;
  }

  public async buildTeamMembers() {
    this.teamMembers = await this.getTeamMembers();
  }

  private async getTeamMembers() {
    // Users[0] its organizer so we are omitting with slice(1)
    const teamMemberPromises = this.users.slice(1).map(async function (user) {
      return {
        id: user.id,
        username: user.username,
        email: user.email || "", // @NOTE: Should we change this "" to teamMemberId?
        name: user.name || "",
        timeZone: user.timeZone,
        language: {
          translate: await getTranslation(user.locale ?? "en", "common"),
          locale: user.locale ?? "en",
        },
        locale: user.locale,
      } as PersonAttendeeCommonFields;
    });
    return await Promise.all(teamMemberPromises);
  }

  public buildUIDCalendarEvent() {
    if (this.users && this.users.length > 0) {
      throw new Error("call buildUsers before calling this function");
    }
    const [mainOrganizer] = this.users;
    const seed = `${mainOrganizer.username}:${dayjs(this.calendarEvent.startTime)
      .utc()
      .format()}:${new Date().getTime()}`;
    const uid = translator.fromUUID(uuidv5(seed, uuidv5.URL));
    this.calendarEvent.uid = uid;
  }

  public setLocation(location: CalendarEventClass["location"]) {
    this.calendarEvent.location = location;
  }

  public setUId(uid: CalendarEventClass["uid"]) {
    this.calendarEvent.uid = uid;
  }

  public setDestinationCalendar(destinationCalendar: CalendarEventClass["destinationCalendar"]) {
    this.calendarEvent.destinationCalendar = destinationCalendar;
  }

  public setHideCalendarNotes(hideCalendarNotes: CalendarEventClass["hideCalendarNotes"]) {
    this.calendarEvent.hideCalendarNotes = hideCalendarNotes;
  }

  public setDescription(description: CalendarEventClass["description"]) {
    this.calendarEvent.description = description;
  }

  public setCancellationReason(cancellationReason: CalendarEventClass["cancellationReason"]) {
    this.calendarEvent.cancellationReason = cancellationReason;
  }

  public buildRescheduleLink(originalBookingUId: string) {
    if (!this.eventType) {
      throw new Error("Run buildEventObjectFromInnerClass before this function");
    }
    const isTeam = !!this.eventType.teamId;

    const queryParams = new URLSearchParams();
    queryParams.set("rescheduleUid", `${originalBookingUId}`);
    const rescheduleLink = `${process.env.NEXT_PUBLIC_WEBAPP_URL}/${
      isTeam ? `/team/${this.eventType.team?.slug}` : this.users[0].username
    }/${this.eventType.slug}?${queryParams.toString()}`;
    this.rescheduleLink = rescheduleLink;
  }
}
