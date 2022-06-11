import type { DestinationCalendar, SelectedCalendar } from "@prisma/client";
import type { Dayjs } from "dayjs";
import type { calendar_v3 } from "googleapis";
import type { Time } from "ical.js";
import type { TFunction } from "next-i18next";

import type { Event } from "./Event";
import type { Ensure } from "./utils";

export type Person = {
  name: string;
  email: string;
  timeZone: string;
  language: { translate: TFunction; locale: string };
  username?: string;
  id?: string;
};

export type EventBusyDate = Record<"start" | "end", Date | string>;

export type CalendarServiceType = typeof Calendar;

export type NewCalendarEventType = {
  uid: string;
  id: string;
  type: string;
  password: string;
  url: string;
  additionalInfo: Record<string, any>;
};

export type CalendarEventType = {
  uid: string;
  etag: string;
  /** This is the actual caldav event url, not the location url. */
  url: string;
  summary: string;
  description: string;
  location: string;
  sequence: number;
  startDate: Date | Dayjs;
  endDate: Date | Dayjs;
  duration: {
    weeks: number;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isNegative: boolean;
  };
  organizer: string;
  attendees: any[][];
  recurrenceId: Time;
  timezone: any;
};

export type BatchResponse = {
  responses: SubResponse[];
};

export type SubResponse = {
  body: { value: { start: { dateTime: string }; end: { dateTime: string } }[] };
};

export interface ConferenceData {
  createRequest?: calendar_v3.Schema$CreateConferenceRequest;
}

export interface AdditionInformation {
  conferenceData?: ConferenceData;
  entryPoints?: EntryPoint[];
  hangoutLink?: string;
}

// If modifying this interface, probably should update builders/calendarEvent files
export interface CalendarEvent {
  type: string;
  title: string;
  startTime: string;
  endTime: string;
  organizer: Person;
  attendees: Person[];
  additionalNotes?: string | null;
  description?: string | null;
  team?: {
    name: string;
    members: string[];
  };
  location?: string | null;
  conferenceData?: ConferenceData;
  additionInformation?: AdditionInformation;
  uid?: string | null;
  videoCallData?: VideoCallData;
  paymentInfo?: PaymentInfo | null;
  destinationCalendar?: DestinationCalendar | null;
  cancellationReason?: string | null;
  rejectionReason?: string | null;
  hideCalendarNotes?: boolean;
}

export interface EntryPoint {
  entryPointType?: string;
  uri?: string;
  label?: string;
  pin?: string;
  accessCode?: string;
  meetingCode?: string;
  passcode?: string;
  password?: string;
}

export interface AdditionInformation {
  conferenceData?: ConferenceData;
  entryPoints?: EntryPoint[];
  hangoutLink?: string;
}

export interface IntegrationCalendar extends Ensure<Partial<SelectedCalendar>, "externalId"> {
  primary?: boolean;
  name?: string;
}

export interface Calendar {
  createEvent(event: CalendarEvent): Promise<NewCalendarEventType>;

  updateEvent(uid: string, event: CalendarEvent): Promise<Event | Event[]>;

  deleteEvent(uid: string, event: CalendarEvent): Promise<unknown>;

  getAvailability(
    dateFrom: string,
    dateTo: string,
    selectedCalendars: IntegrationCalendar[]
  ): Promise<EventBusyDate[]>;

  listCalendars(event?: CalendarEvent): Promise<IntegrationCalendar[]>;
}
