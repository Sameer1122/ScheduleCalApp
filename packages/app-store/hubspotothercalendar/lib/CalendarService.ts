import * as hubspot from "@hubspot/api-client";
import { BatchInputPublicAssociation } from "@hubspot/api-client/lib/codegen/crm/associations";
import { PublicObjectSearchRequest } from "@hubspot/api-client/lib/codegen/crm/contacts";
import { BatchInputSimplePublicObjectInput } from "@hubspot/api-client/lib/codegen/crm/objects";
import { SimplePublicObjectInput } from "@hubspot/api-client/lib/codegen/crm/objects/meetings";
import { Credential } from "@prisma/client";

import { getLocation, getAdditionalNotes } from "@calcom/lib/CalEventParser";
import { WEBAPP_URL } from "@calcom/lib/constants";
import logger from "@calcom/lib/logger";
import prisma from "@calcom/prisma";
import type {
  AdditionInformation,
  Calendar,
  CalendarEvent,
  ConferenceData,
  EventBusyDate,
  IntegrationCalendar,
  NewCalendarEventType,
} from "@calcom/types/Calendar";

import type { HubspotToken } from "../api/callback";

const hubspotClient = new hubspot.Client();

const client_id = process.env.HUBSPOT_CLIENT_ID;
const client_secret = process.env.HUBSPOT_CLIENT_SECRET;

export default class HubspotOtherCalendarService implements Calendar {
  private url = "";
  private integrationName = "";
  private auth: { getToken: () => Promise<any> };
  private log: typeof logger;

  constructor(credential: Credential) {
    this.integrationName = "hubspot_other_calendar";

    this.auth = this.hubspotAuth(credential);

    this.log = logger.getChildLogger({ prefix: [`[[lib] ${this.integrationName}`] });
  }

  private hubspotContactSearch = async (event: CalendarEvent) => {
    const publicObjectSearchRequest: PublicObjectSearchRequest = {
      filterGroups: event.attendees.map((attendee) => ({
        filters: [
          {
            value: attendee.email,
            propertyName: "email",
            operator: "EQ",
          },
        ],
      })),
      sorts: ["hs_object_id"],
      properties: ["hs_object_id", "email"],
      limit: 10,
      after: 0,
    };

    return await hubspotClient.crm.contacts.searchApi
      .doSearch(publicObjectSearchRequest)
      .then((apiResponse) => apiResponse.results);
  };

  private getHubspotMeetingBody = (event: CalendarEvent): string => {
    return `<b>${event.organizer.language.translate("invitee_timezone")}:</b> ${
      event.attendees[0].timeZone
    }<br><br><b>${event.organizer.language.translate("share_additional_notes")}</b><br>${
      event.additionalNotes || "-"
    }`;
  };

  private hubspotCreateMeeting = async (event: CalendarEvent) => {
    const simplePublicObjectInput: SimplePublicObjectInput = {
      properties: {
        hs_timestamp: Date.now().toString(),
        hs_meeting_title: event.title,
        hs_meeting_body: this.getHubspotMeetingBody(event),
        hs_meeting_location: getLocation(event),
        hs_meeting_start_time: new Date(event.startTime).toISOString(),
        hs_meeting_end_time: new Date(event.endTime).toISOString(),
        hs_meeting_outcome: "SCHEDULED",
      },
    };

    return hubspotClient.crm.objects.meetings.basicApi.create(simplePublicObjectInput);
  };

  private hubspotAssociate = async (meeting: any, contacts: any) => {
    const batchInputPublicAssociation: BatchInputPublicAssociation = {
      inputs: contacts.map((contact: any) => ({
        _from: { id: meeting.id },
        to: { id: contact.id },
        type: "meeting_event_to_contact",
      })),
    };
    return hubspotClient.crm.associations.batchApi.create(
      "meetings",
      "contacts",
      batchInputPublicAssociation
    );
  };

  private hubspotUpdateMeeting = async (uid: string, event: CalendarEvent) => {
    const simplePublicObjectInput: SimplePublicObjectInput = {
      properties: {
        hs_timestamp: Date.now().toString(),
        hs_meeting_title: event.title,
        hs_meeting_body: this.getHubspotMeetingBody(event),
        hs_meeting_location: getLocation(event),
        hs_meeting_start_time: new Date(event.startTime).toISOString(),
        hs_meeting_end_time: new Date(event.endTime).toISOString(),
        hs_meeting_outcome: "RESCHEDULED",
      },
    };

    return hubspotClient.crm.objects.meetings.basicApi.update(uid, simplePublicObjectInput);
  };

  private hubspotDeleteMeeting = async (uid: string) => {
    return hubspotClient.crm.objects.meetings.basicApi.archive(uid);
  };

  private hubspotAuth = (credential: Credential) => {
    const credentialKey = credential.key as unknown as HubspotToken;
    const isTokenValid = (token: HubspotToken) =>
      token &&
      token.tokenType &&
      token.accessToken &&
      token.expiryDate &&
      (token.expiresIn || token.expiryDate) < Date.now();

    const refreshAccessToken = async (refreshToken: string) => {
      try {
        const hubspotRefreshToken: HubspotToken = await hubspotClient.oauth.tokensApi.createToken(
          "refresh_token",
          undefined,
          WEBAPP_URL + "/api/integrations/hubspotothercalendar/callback",
          client_id,
          client_secret,
          refreshToken
        );

        // set expiry date as offset from current time.
        hubspotRefreshToken.expiryDate = Math.round(Date.now() + hubspotRefreshToken.expiresIn * 1000);
        await prisma.credential.update({
          where: {
            id: credential.id,
          },
          data: {
            key: hubspotRefreshToken as any,
          },
        });

        hubspotClient.setAccessToken(hubspotRefreshToken.accessToken);
      } catch (e: unknown) {
        this.log.error(e);
      }
    };

    return {
      getToken: () =>
        !isTokenValid(credentialKey) ? Promise.resolve([]) : refreshAccessToken(credentialKey.refreshToken),
    };
  };

  async createEvent(event: CalendarEvent): Promise<NewCalendarEventType> {
    await this.auth.getToken();
    const contacts = await this.hubspotContactSearch(event);
    if (contacts) {
      const meetingEvent = await this.hubspotCreateMeeting(event);
      if (meetingEvent) {
        const associatedMeeting = await this.hubspotAssociate(meetingEvent, contacts);
        if (associatedMeeting) {
          return Promise.resolve({
            uid: meetingEvent.id,
            id: meetingEvent.id,
            type: "hubspot_other_calendar",
            password: "",
            url: "",
            additionalInfo: { contacts, associatedMeeting },
          });
        }
        return Promise.reject("Something went wrong when associating the meeting and attendees in HubSpot");
      }
      return Promise.reject("Something went wrong when creating a meeting in HubSpot");
    }
    return Promise.reject("Something went wrong when searching the atendee in HubSpot");
  }

  async updateEvent(uid: string, event: CalendarEvent): Promise<any> {
    await this.auth.getToken();
    return await this.hubspotUpdateMeeting(uid, event);
  }

  async deleteEvent(uid: string): Promise<void> {
    await this.auth.getToken();
    return await this.hubspotDeleteMeeting(uid);
  }

  async getAvailability(
    dateFrom: string,
    dateTo: string,
    selectedCalendars: IntegrationCalendar[]
  ): Promise<EventBusyDate[]> {
    return Promise.resolve([]);
  }

  async listCalendars(event?: CalendarEvent): Promise<IntegrationCalendar[]> {
    return Promise.resolve([]);
  }
}
