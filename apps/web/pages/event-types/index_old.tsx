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
import Shell from "@components/Shell-old";
import { Tooltip } from "@components/Tooltip";
import ConfirmationDialogContent from "@components/dialog/ConfirmationDialogContent";
import CreateEventTypeButton from "@components/eventtype/CreateEventType";
import EventTypeDescription from "@components/eventtype/EventTypeDescription";
import Avatar from "@components/ui/Avatar";
import AvatarGroup from "@components/ui/AvatarGroup";
import Badge from "@components/ui/Badge";

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

const Item = ({ type, group, readOnly }: any) => {
  const { t } = useLocale();

  return (
    <Link href={"/event-types/" + type.id}>
      <a
        className="flex-grow truncate text-sm"
        title={`${type.title} ${type.description ? `– ${type.description}` : ""}`}>
        <div>
          <span
            className="truncate font-medium text-neutral-900 ltr:mr-1 rtl:ml-1"
            data-testid={"event-type-title-" + type.id}>
            {type.title}
          </span>
          <small
            className="hidden text-neutral-500 sm:inline"
            data-testid={"event-type-slug-" + type.id}>{`/${group.profile.slug}/${type.slug}`}</small>
          {type.hidden && (
            <span className="rtl:mr-2inline items-center rounded-sm bg-yellow-100 px-1.5 py-0.5 text-xs font-medium text-yellow-800 ltr:ml-2">
              {t("hidden")}
            </span>
          )}
          {readOnly && (
            <span className="rtl:mr-2inline items-center rounded-sm bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-800 ltr:ml-2">
              {t("readonly")}
            </span>
          )}
        </div>
        <EventTypeDescription eventType={type} />
      </a>
    </Link>
  );
};

const MemoizedItem = React.memo(Item);

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

  async function deleteEventTypeHandler(id: number) {
    const payload = { id };
    deleteMutation.mutate(payload);
  }

  // inject selection data into url for correct router history
  const openModal = (group: EventTypeGroup, type: EventType) => {
    const query = {
      ...router.query,
      dialog: "new-eventtype",
      eventPage: group.profile.slug,
      title: type.title,
      slug: type.slug,
      description: type.description,
      length: type.length,
      type: type.schedulingType,
      teamId: group.teamId,
    };
    if (!group.teamId) {
      delete query.teamId;
    }
    router.push(
      {
        pathname: router.pathname,
        query,
      },
      undefined,
      { shallow: true }
    );
  };

  const deleteMutation = trpc.useMutation("viewer.eventTypes.delete", {
    onSuccess: async () => {
      await utils.invalidateQueries(["viewer.eventTypes"]);
      showToast(t("event_type_deleted_successfully"), "success");
    },
    onError: (err) => {
      if (err instanceof HttpError) {
        const message = `${err.statusCode}: ${err.message}`;
        showToast(message, "error");
      }
    },
  });

  const [isNativeShare, setNativeShare] = useState(true);

  useEffect(() => {
    if (!navigator.share) {
      setNativeShare(false);
    }
  }, []);

  return (
    <div className="-mx-4 mb-16 overflow-hidden rounded-sm border border-gray-200 bg-white sm:mx-0">
      <ul className="divide-y divide-neutral-200" data-testid="event-types">
        {types.map((type, index) => (
          <li
            key={type.id}
            className={classNames(
              type.$disabled && "pointer-events-none cursor-not-allowed select-none opacity-30"
            )}
            data-disabled={type.$disabled ? 1 : 0}>
            <div
              className={classNames(
                "flex items-center justify-between hover:bg-neutral-50 ",
                type.$disabled && "pointer-events-none"
              )}>
              <div className="group flex w-full items-center justify-between px-4 py-4 hover:bg-neutral-50 sm:px-6">
                {types.length > 1 && (
                  <>
                    <button
                      className="invisible absolute left-1/2 -mt-4 mb-4 -ml-4 hidden h-7 w-7 scale-0 rounded-full border bg-white p-1 text-gray-400 transition-all hover:border-transparent hover:text-black hover:shadow group-hover:visible group-hover:scale-100 sm:left-[19px] sm:ml-0 sm:block"
                      onClick={() => moveEventType(index, -1)}>
                      <ArrowUpIcon />
                    </button>

                    <button
                      className="invisible absolute left-1/2 mt-8 -ml-4 hidden h-7 w-7 scale-0 rounded-full border bg-white p-1 text-gray-400 transition-all hover:border-transparent hover:text-black hover:shadow group-hover:visible group-hover:scale-100 sm:left-[19px] sm:ml-0 sm:block"
                      onClick={() => moveEventType(index, 1)}>
                      <ArrowDownIcon />
                    </button>
                  </>
                )}
                <MemoizedItem type={type} group={group} readOnly={readOnly} />
                <div className="mt-4 hidden flex-shrink-0 sm:mt-0 sm:ml-5 sm:flex">
                  <div className="flex justify-between rtl:space-x-reverse">
                    {type.users?.length > 1 && (
                      <AvatarGroup
                        border="border-2 border-white"
                        className="relative top-1 right-3"
                        size={8}
                        truncateAfter={4}
                        items={type.users.map((organizer) => ({
                          alt: organizer.name || "",
                          image: `${process.env.NEXT_PUBLIC_WEBSITE_URL}/${organizer.username}/avatar.png`,
                        }))}
                      />
                    )}
                    <Tooltip content={t("preview")}>
                      <a
                        href={`${process.env.NEXT_PUBLIC_WEBSITE_URL}/${group.profile.slug}/${type.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-icon appearance-none">
                        <ExternalLinkIcon className="h-5 w-5 group-hover:text-black" />
                      </a>
                    </Tooltip>

                    <Tooltip content={t("copy_link")}>
                      <button
                        onClick={() => {
                          showToast(t("link_copied"), "success");
                          navigator.clipboard.writeText(
                            `${process.env.NEXT_PUBLIC_WEBSITE_URL}/${group.profile.slug}/${type.slug}`
                          );
                        }}
                        className="btn-icon">
                        <LinkIcon className="h-5 w-5 group-hover:text-black" />
                      </button>
                    </Tooltip>
                    <Dropdown>
                      <DropdownMenuTrigger
                        className="h-10 w-10 cursor-pointer rounded-sm border border-transparent text-neutral-500 hover:border-gray-300 hover:text-neutral-900"
                        data-testid={"event-type-options-" + type.id}>
                        <DotsHorizontalIcon className="h-5 w-5 group-hover:text-gray-800" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>
                          <Link href={"/event-types/" + type.id} passHref={true}>
                            <Button
                              type="button"
                              size="sm"
                              color="minimal"
                              className="w-full rounded-none"
                              StartIcon={PencilIcon}>
                              {" "}
                              {t("edit")}
                            </Button>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Button
                            type="button"
                            color="minimal"
                            size="sm"
                            className="w-full rounded-none"
                            data-testid={"event-type-duplicate-" + type.id}
                            StartIcon={DuplicateIcon}
                            onClick={() => openModal(group, type)}>
                            {t("duplicate")}
                          </Button>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="h-px bg-gray-200" />
                        <DropdownMenuItem>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                                color="warn"
                                size="sm"
                                StartIcon={TrashIcon}
                                className="w-full rounded-none">
                                {t("delete")}
                              </Button>
                            </DialogTrigger>
                            <ConfirmationDialogContent
                              variety="danger"
                              title={t("delete_event_type")}
                              confirmBtnText={t("confirm_delete_event_type")}
                              onConfirm={(e) => {
                                e.preventDefault();
                                deleteEventTypeHandler(type.id);
                              }}>
                              {t("delete_event_type_description")}
                            </ConfirmationDialogContent>
                          </Dialog>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </Dropdown>
                  </div>
                </div>
              </div>
              <div className="mr-5 flex flex-shrink-0 sm:hidden">
                <Dropdown>
                  <DropdownMenuTrigger className="h-10 w-10 cursor-pointer rounded-sm border border-transparent text-neutral-500 hover:border-gray-300 hover:text-neutral-900">
                    <DotsHorizontalIcon className="h-5 w-5 group-hover:text-gray-800" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent portalled>
                    <DropdownMenuItem>
                      <Link
                        href={`${process.env.NEXT_PUBLIC_WEBSITE_URL}/${group.profile.slug}/${type.slug}`}>
                        <a target="_blank">
                          <Button
                            color="minimal"
                            size="sm"
                            StartIcon={ExternalLinkIcon}
                            className="w-full rounded-none">
                            {t("preview")}
                          </Button>
                        </a>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Button
                        type="button"
                        color="minimal"
                        size="sm"
                        className="w-full rounded-none text-left"
                        data-testid={"event-type-duplicate-" + type.id}
                        StartIcon={ClipboardCopyIcon}
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `${process.env.NEXT_PUBLIC_WEBSITE_URL}/${group.profile.slug}/${type.slug}`
                          );
                          showToast(t("link_copied"), "success");
                        }}>
                        {t("copy_link")}
                      </Button>
                    </DropdownMenuItem>
                    {isNativeShare ? (
                      <DropdownMenuItem>
                        <Button
                          type="button"
                          color="minimal"
                          size="sm"
                          className="w-full rounded-none"
                          data-testid={"event-type-duplicate-" + type.id}
                          StartIcon={UploadIcon}
                          onClick={() => {
                            navigator
                              .share({
                                title: t("share"),
                                text: t("share_event"),
                                url: `${process.env.NEXT_PUBLIC_WEBSITE_URL}/${group.profile.slug}/${type.slug}`,
                              })
                              .then(() => showToast(t("link_shared"), "success"))
                              .catch(() => showToast(t("failed"), "error"));
                          }}>
                          {t("share")}
                        </Button>
                      </DropdownMenuItem>
                    ) : null}
                    <DropdownMenuItem>
                      <Button
                        type="button"
                        size="sm"
                        href={"/event-types/" + type.id}
                        color="minimal"
                        className="w-full rounded-none"
                        StartIcon={PencilIcon}>
                        {" "}
                        {t("edit")}
                      </Button>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Button
                        type="button"
                        color="minimal"
                        size="sm"
                        className="w-full rounded-none"
                        data-testid={"event-type-duplicate-" + type.id}
                        StartIcon={DuplicateIcon}
                        onClick={() => openModal(group, type)}>
                        {t("duplicate")}
                      </Button>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="h-px bg-gray-200" />
                    <DropdownMenuItem>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                            color="warn"
                            size="sm"
                            StartIcon={TrashIcon}
                            className="w-full rounded-none">
                            {t("delete")}
                          </Button>
                        </DialogTrigger>
                        <ConfirmationDialogContent
                          variety="danger"
                          title={t("delete_event_type")}
                          confirmBtnText={t("confirm_delete_event_type")}
                          onConfirm={(e) => {
                            e.preventDefault();
                            deleteEventTypeHandler(type.id);
                          }}>
                          {t("delete_event_type_description")}
                        </ConfirmationDialogContent>
                      </Dialog>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </Dropdown>
              </div>
            </div>
          </li>
        ))}
      </ul>
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

const CTA = () => {
  const query = trpc.useQuery(["viewer.eventTypes"]);

  if (!query.data) return null;

  return (
    <CreateEventTypeButton canAddEvents={query.data.viewer.canAddEvents} options={query.data.profiles} />
  );
};

const WithQuery = withQuery(["viewer.eventTypes"]);
const EventTypesPageOld = () => {
  const { t } = useLocale();

  return (
    <div>
      <Head>
        <title>Home | Cal.com</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Shell heading={t("event_types_page_title")} subtitle={t("event_types_page_subtitle")} CTA={<CTA />}>
        <WithQuery
          success={({ data }) => (
            <>
              {data.viewer.plan === "FREE" && !data.viewer.canAddEvents && (
                <Alert
                  severity="warning"
                  title={<>{t("plan_upgrade")}</>}
                  message={
                    <Trans i18nKey="plan_upgrade_instructions">
                      You can
                      <a href="/api/upgrade" className="underline">
                        upgrade here
                      </a>
                      .
                    </Trans>
                  }
                  className="mb-4"
                />
              )}
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
    </div>
  );
};

export default EventTypesPageOld;
