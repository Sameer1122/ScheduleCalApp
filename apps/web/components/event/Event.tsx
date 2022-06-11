import React, { Fragment, useEffect, useState } from "react";
import { Button, Image } from "antd";
import styled from "styled-components";
import { inferQueryOutput, trpc } from "@lib/trpc";
import classNames from "@lib/classNames";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import Link from "next/link";
import { useRouter } from "next/router";
import EventTypeDescription from "@components/eventtype/EventTypeDescription";

import {
	CogIcon,
  ShareIcon,
} from "@heroicons/react/outline";
import Dropdown, {
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@calcom/ui/Dropdown";
import { Dialog, DialogTrigger } from "@calcom/ui/Dialog";
import ConfirmationDialogContent from "@components/dialog/ConfirmationDialogContent";
import showToast from "@calcom/lib/notification";
import { HttpError } from "@lib/core/http/error";

type EventTypeGroup = inferQueryOutput<"viewer.eventTypes">["eventTypeGroups"][number];
type EventType = EventTypeGroup["eventTypes"][number];


const Item = ({ type, group, readOnly }: any) => {
	const { t } = useLocale();

	return (
		<Link href={"/event-types/" + type.id}>
			<a
				className="w-full block h-[176px] pt-4 px-4 truncate text-sm"
				title={`${type.title} ${type.description ? `– ${type.description}` : ""}`}>
				<div className="flex items-center">
					<Image src={`${process.env.NEXT_PUBLIC_WEBSITE_URL}/custom/upload_icon.svg`} className="h-10 w-10" />
					<span
						className="truncate font-medium text-neutral-900 ltr:mr-1 rtl:ml-1"
						data-testid={"event-type-title-" + type.id}>
						{type.title}
					</span>
					{/* <small
						className="hidden text-neutral-500 sm:inline"
						data-testid={"event-type-slug-" + type.id}>{`/${group.profile.slug}/${type.slug}`}</small> */}
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
				<CustomDivider />
				<EventTypeDescription eventType={type} />
			</a>
		</Link>
	);
};

const MemoizedItem = React.memo(Item);

const Event = (props: {
	type: EventType,
	group: EventTypeGroup,
	readOnly: boolean
}) => {
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

	async function deleteEventTypeHandler(id: number) {
    const payload = { id };
    deleteMutation.mutate(payload);
  }

	const [isNativeShare, setNativeShare] = useState(true);

  useEffect(() => {
    if (!navigator.share) {
      setNativeShare(false);
    }
  }, []);

	return (
		<div>
			<StyledContainer
				className={classNames(
					props.type.$disabled && "pointer-events-none cursor-not-allowed select-none opacity-30"
				)}
				data-disabled={props.type.$disabled ? 1 : 0}
			>
				<MemoizedItem type={props.type} group={props.group} readOnly={props.readOnly} />
				<EventFooter>
					<Dropdown>
						<DropdownMenuTrigger
							className="w-1/2 cursor-pointer rounded-sm bg-[#007A3E] text-white justify-center"
							data-testid={"event-type-options-" + props.type.id}>
							<CogIcon className="h-8 w-8 inline" /> &nbsp;&nbsp; Setting
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start">
							<DropdownMenuItem>
								<a href={`${process.env.NEXT_PUBLIC_WEBSITE_URL}/${props.group.profile.slug}/${props.type.slug}`} target="_blank">
									<Button
										color="minimal"
										className="w-full rounded-none"
										>
										{t("preview")}
									</Button>
								</a>
							</DropdownMenuItem>
							<DropdownMenuItem>
								<Link href={"/event-types/" + props.type.id} passHref={true}>
									<Button
										color="minimal"
										className="w-full rounded-none"
										>
										{t("edit")}
									</Button>
								</Link>
							</DropdownMenuItem>
							<DropdownMenuItem>
								<Button
									color="minimal"
									className="w-full rounded-none"
									data-testid={"event-type-duplicate-" + props.type.id}
									onClick={() => openModal(props.group, props.type)}>
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
											deleteEventTypeHandler(props.type.id);
										}}>
										{t("delete_event_type_description")}
									</ConfirmationDialogContent>
								</Dialog>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</Dropdown>
					<Button
						onClick={() => {
							showToast(t("link_copied"), "success");
							navigator.clipboard.writeText(
								`${process.env.NEXT_PUBLIC_WEBSITE_URL}/${props.group.profile.slug}/${props.type.slug}`
							);
						}}
						icon={<ShareIcon className="h-8 w-8 inline" />}
						style={{padding: 0, height: '48px'}}
						className="w-1/2">
						&nbsp;&nbsp;Share
					</Button>
				</EventFooter>
			</StyledContainer>
		</div>
	);
};

const StyledContainer = styled.div`
    box-shadow: 0px 4px 8px -2px rgba(16, 24, 40, 0.1), 0px 2px 4px -2px rgba(16, 24, 40, 0.06);
    border-radius: 8px;
    background: #FFFFFF;
    width: 300px;
		height: 224px;
  `;
const CustomDivider = styled.div`
	display: flex;
	clear: both;
	width: 100%;
	min-width: 100%;
	margin: 5px 0;
	color: rgba(0, 0, 0, 0.85);
	border-top: 1px solid rgba(0, 0, 0, 0.06);
	padding: 0 10px;
`;
const EventFooter = styled.div`
    display:flex;
		align-items:center;
		width: 100%;
    flex-direction: row;
    height: 48px;
  `;
export default Event;
