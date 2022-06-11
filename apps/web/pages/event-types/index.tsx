import { CalendarIcon } from "@heroicons/react/outline";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  DotsHorizontalIcon,
  ExternalLinkIcon,
  DuplicateIcon,
  LinkIcon,
  UploadIcon,
  ClipboardCopyIcon,
  TrashIcon,
  PencilIcon,
} from "@heroicons/react/solid";
import { UsersIcon } from "@heroicons/react/solid";
import { Trans } from "next-i18next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { Fragment, useEffect, useState } from "react";

import { useLocale } from "@calcom/lib/hooks/useLocale";
import showToast from "@calcom/lib/notification";
import { Button } from "@calcom/ui";
import { Alert } from "@calcom/ui/Alert";
import { Dialog, DialogTrigger } from "@calcom/ui/Dialog";
import Dropdown, {
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@calcom/ui/Dropdown";

import { withQuery } from "@lib/QueryCell";
import classNames from "@lib/classNames";
import { HttpError } from "@lib/core/http/error";
import { inferQueryOutput, trpc } from "@lib/trpc";

import EmptyScreen from "@components/EmptyScreen";
import Shell from "@components/Shell";
import { Tooltip } from "@components/Tooltip";
import ConfirmationDialogContent from "@components/dialog/ConfirmationDialogContent";
import CreateEventTypeButton from "@components/eventtype/CreateEventType";
import EventTypeDescription from "@components/eventtype/EventTypeDescription";
import Avatar from "@components/ui/Avatar";
import AvatarGroup from "@components/ui/AvatarGroup";
import Badge from "@components/ui/Badge";

import MainLayout from "@components/layout/main";
import Event from "@components/event/Event";
import EmptyEvent from "@components/event/EmptyEvent";

type Profiles = inferQueryOutput<"viewer.eventTypes">["profiles"];

interface CreateEventTypeProps {
  canAddEvents: boolean;
  profiles: Profiles;
}

type EventTypeGroups = inferQueryOutput<"viewer.eventTypes">["eventTypeGroups"];
type EventTypeGroupProfile = EventTypeGroups[number]["profile"];
interface EventTypeListHeadingProps {
  profile: EventTypeGroupProfile;
  membershipCount: number;
}

type EventTypeGroup = inferQueryOutput<"viewer.eventTypes">["eventTypeGroups"][number];
type EventType = EventTypeGroup["eventTypes"][number];
interface EventTypeListProps {
  group: EventTypeGroup;
  groupIndex: number;
  readOnly: boolean;
  types: EventType[];
}

export const EventTypeList = ({ group, groupIndex, readOnly, types }: EventTypeListProps): JSX.Element => {
  const { t } = useLocale();
  const router = useRouter();

  const utils = trpc.useContext();
  const mutation = trpc.useMutation("viewer.eventTypeOrder", {
    onError: async (err) => {
      console.error(err.message);
      await utils.cancelQuery(["viewer.eventTypes"]);
      await utils.invalidateQueries(["viewer.eventTypes"]);
    },
  });

  function moveEventType(index: number, increment: 1 | -1) {
    const newList = [...types];

    const type = types[index];
    const tmp = types[index + increment];
    if (tmp) {
      newList[index] = tmp;
      newList[index + increment] = type;
    }

    utils.cancelQuery(["viewer.eventTypes"]);
    utils.setQueryData(["viewer.eventTypes"], (data) =>
      Object.assign(data, {
        eventTypesGroups: [
          data?.eventTypeGroups.slice(0, groupIndex),
          Object.assign(group, {
            eventTypes: newList,
          }),
          data?.eventTypeGroups.slice(groupIndex + 1),
        ],
      })
    );

    mutation.mutate({
      ids: newList.map((type) => type.id),
    });
  }

  return (
    <div className="mb-16 rounded-sm flex gap-5 flex-wrap">
      {types.map((type, index) => (
        <Event key={index} type={type} group={group} readOnly={readOnly} />
      ))}
      <EmptyEvent />
    </div>
  );
};

const EventTypeListHeading = ({ profile, membershipCount }: EventTypeListHeadingProps): JSX.Element => (
  <div className="mb-4 flex">
    <Link href="/settings/teams">
      <a>
        <Avatar
          alt={profile?.name || ""}
          imageSrc={profile?.image || undefined}
          size={8}
          className="mt-1 inline ltr:mr-2 rtl:ml-2"
        />
      </a>
    </Link>
    <div>
      <Link href="/settings/teams">
        <a className="font-bold">{profile?.name || ""}</a>
      </Link>
      {membershipCount && (
        <span className="relative -top-px text-xs text-neutral-500 ltr:ml-2 rtl:mr-2">
          <Link href="/settings/teams">
            <a>
              <Badge variant="gray">
                <UsersIcon className="mr-1 -mt-px inline h-3 w-3" />
                {membershipCount}
              </Badge>
            </a>
          </Link>
        </span>
      )}
      {profile?.slug && (
        <Link href={`${process.env.NEXT_PUBLIC_WEBSITE_URL}/${profile.slug}`}>
          <a className="block text-xs text-neutral-500">{`${process.env.NEXT_PUBLIC_WEBSITE_URL?.replace(
            "https://",
            ""
          )}/${profile.slug}`}</a>
        </Link>
      )}
    </div>
  </div>
);

const CreateFirstEventTypeView = ({ canAddEvents, profiles }: CreateEventTypeProps) => {
  const { t } = useLocale();

  return (
    <EmptyScreen
      Icon={CalendarIcon}
      headline={t("new_event_type_heading")}
      description={t("new_event_type_description")}
    />
  );
};

const WithQuery = withQuery(["viewer.eventTypes"]);
const EventTypesPage = () => {
  const { t } = useLocale();

  return (
    <MainLayout>
      <Shell heading={"Events"}>
        <WithQuery
          success={({ data }) => (
            <>
              {data.eventTypeGroups.map((group, index) => (
                <Fragment key={group.profile.slug}>
                  {/* hide list heading when there is only one (current user) */}
                  {(data.eventTypeGroups.length !== 1 || group.teamId) && (
                    <EventTypeListHeading
                      profile={group.profile}
                      membershipCount={group.metadata.membershipCount}
                    />
                  )}
                  <EventTypeList
                    types={group.eventTypes}
                    group={group}
                    groupIndex={index}
                    readOnly={group.metadata.readOnly}
                  />
                </Fragment>
              ))}

              {data.eventTypeGroups.length === 0 && (
                <CreateFirstEventTypeView profiles={data.profiles} canAddEvents={data.viewer.canAddEvents} />
              )}
            </>
          )}
        />
      </Shell>
    </MainLayout>
  );
};

export default EventTypesPage;
