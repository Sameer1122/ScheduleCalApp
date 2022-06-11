import React from "react";
import { Form, Steps, Button, message, Typography } from "antd";
import { useRouter } from "next/router";
import styled from "styled-components";
import CreateEventType from "@components/event/CreateEventType";
import CreateEventDetail from "@components/event/CreateEventDetail";
import CreateSchedule from "@components/event/CreateShedule";
import CreateBookingForm from "@components/event/CreateBookingForm";
import Link from "next/link";
import MainLayout from "@components/layout/main";
import { GetServerSidePropsContext } from "next";
import { getSession } from "@lib/auth";
import { EventTypeCustomInput, MembershipRole, PeriodType, Prisma, SchedulingType } from "@prisma/client";
import prisma from "@lib/prisma";
import getApps, { getLocationOptions, hasIntegration } from "@calcom/app-store/utils";
import { StripeData } from "@calcom/stripe/server";
import { inferSSRProps } from "@lib/types/inferSSRProps";
import { inferQueryOutput, trpc } from "@lib/trpc";
import moment from "moment";
import showToast from "@calcom/lib/notification";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { HttpError } from "@lib/core/http/error";
import { LocationType } from "@calcom/core/location";

import { getTranslation } from "@server/lib/i18n";
import { useForm } from "react-hook-form";
import { DEFAULT_SCHEDULE, availabilityAsString } from "@calcom/lib/availability";


const { Step } = Steps;
const { Text } = Typography;
const StyledCard = styled.div`
  display: flex;
	width: 700px;
  flex-direction: column;
  justify-content: center;
  padding: 40px;
  align-self: center;
  justify-self: center;
  background: #ffffff;
  box-shadow: 0px 4px 8px -2px rgba(16, 24, 40, 0.1), 0px 2px 4px -2px rgba(16, 24, 40, 0.06);
	border-radius: 8px;
`;

type eventLocationType = {
	type: LocationType,
	address?: string,
	link?: string
}

type eventDetailsType = {
	eventName: string;
	eventDesc: string;
	eventDuration: number;
	eventLocations: eventLocationType[];
	eventLink: string;
};

const CreateEvent = (props: inferSSRProps<typeof getServerSideProps>) => {
	const router = useRouter();
	const { t } = useLocale();
	const { session, integrations, locationOptions } = props;
	const [current, setCurrent] = React.useState(0);
	const [eventType, setEventType] = React.useState(0);
	const [eventDetails, setEventDetails] = React.useState<eventDetailsType>({
		eventName: '',
		eventDesc: '',
		eventDuration: 60,
		eventLocations: [],
		eventLink: ''
	});
	const [eventSchedule, setEventSchedule] = React.useState({
		eventPeriodType: 'ROLLING',
		eventPeriodCountCalendarDays: 1,
		eventPeriodDays: 3,
		eventPeriodStartDate: moment(),
		eventPeriodEndDate: moment(),
		eventPeriodAvailability: null,
		eventIsNewAvailabliity: false,
		eventNewAvailabliityName: 'Working Hour',
		eventTimeZone: 'America/Detroit',
		eventWeeklyHours: [],
		eventSpecificHours: [],
		eventBeforeBuffer: 0,
		eventAfterBuffer: 0,
		eventSlotInterval: 0,
		eventMiniBN: 2,
		eventMiniBNType: "h",
		eventMiniBNCount: 1,
		eventLockTimeZone: false
	});

	const scheduleForm = useForm({
		defaultValues: {
			schedule: DEFAULT_SCHEDULE
		}
	})
	const [eventDetailsForm] = Form.useForm();
	eventDetailsForm.setFieldsValue(eventDetails);

	const [eventScheduleForm] = Form.useForm();
	eventScheduleForm.setFieldsValue({
		eventPeriodType: 'ROLLING',
		eventPeriodCountCalendarDays: 1,
		eventPeriodDays: 3,
		eventPeriodStartDate: moment(),
		eventPeriodEndDate: moment(),
		eventPeriodAvailability: null,
		eventIsNewAvailabliity: false,
		eventNewAvailabliityName: 'Working Hour',
		eventTimeZone: 'America/Detroit',
		eventWeeklyHours: [],
		eventSpecificHours: [],
		eventBeforeBuffer: 0,
		eventAfterBuffer: 0,
		eventSlotInterval: 0,
		eventMiniBN: 2,
		eventMiniBNType: "h",
		eventMiniBNCount: 1,
		eventLockTimeZone: false
	});


	const [eventBookingForm, setEventBookingForm] = React.useState({
		eventInviteeName: "",
		eventInviteeEmail: "",
		eventInviteeComment: "",
		eventCustomInputs: []
	})

	const steps = [
		{
			title: "Event Type",
			content: <CreateEventType eventType={eventType} setEventType={setEventType} />,
		},
		{
			title: "Event Details",
			content: <CreateEventDetail
				detailsForm={eventDetailsForm}
				eventType={eventType}
				eventDetails={eventDetails}
				setEventDetails={setEventDetails}
				slug={session.user.name}
				locationOptions={locationOptions}
			/>,
		},
		{
			title: "Schedule",
			content: <CreateSchedule
				scheduleForm={scheduleForm}
				eventSchedule={eventSchedule}
				setEventSchedule={setEventSchedule}
			/>,
		},
		{
			title: "Booking Form",
			content: <CreateBookingForm
				eventBookingForm={eventBookingForm}
				setEventBookingForm={setEventBookingForm}
			/>,
		},
	];

	const createScheduleMutation = trpc.useMutation("viewer.availability.schedule.create", {
		onSuccess: async ({ schedule }) => {
			return schedule
		},
		onError: (err) => {
			let message = "";
			if (err instanceof HttpError) {
				const message = `${err.statusCode}: ${err.message}`;
				showToast(message, "error");
			}

			if (err.data?.code === "UNAUTHORIZED") {
				message = `${err.data.code}: You are not able to update this event`;
			}

			if (err.data?.code === "PARSE_ERROR") {
				message = `${err.data.code}: ${err.message}`;
			}

			if (message) {
				showToast(message, "error");
			}
		},
	});

	const createMutation = trpc.useMutation("viewer.eventTypes.full_create", {
		onSuccess: async ({ eventType }) => {
			await router.push("/event-types");
			showToast(
				t("event_type_updated_successfully", {
					eventTypeTitle: eventType.title,
				}),
				"success"
			);
		},
		onError: (err) => {
			let message = "";
			if (err instanceof HttpError) {
				const message = `${err.statusCode}: ${err.message}`;
				showToast(message, "error");
			}

			if (err.data?.code === "UNAUTHORIZED") {
				message = `${err.data.code}: You are not able to update this event`;
			}

			if (err.data?.code === "PARSE_ERROR") {
				message = `${err.data.code}: ${err.message}`;
			}

			if (message) {
				showToast(message, "error");
			}
		},
	});

	const next = () => {
		//validation current step before go next
		if(current == 1) {
			eventDetailsForm.validateFields()
			.then(values => {
				console.log("details values: ", values);
				setEventDetails({...values, eventLocations: eventDetailsForm.getFieldValue('eventLocations')});
				setCurrent(current + 1);
			}).catch(info => {
				console.log('Validate Failed:', info);
			})
		} else {
			setCurrent(current + 1);
		}
	};

	const prev = () => {
		setCurrent(current - 1);
	};

	const complete = async () => {
		let new_schedule = await createScheduleMutation.mutateAsync({
			name: eventSchedule.eventNewAvailabliityName,
			timezone: eventSchedule.eventTimeZone || undefined,
			schedule: scheduleForm.getValues().schedule
		})

		//validation last step or all steps
		createMutation.mutate({
			title: eventDetails.eventName,
			slug: eventDetails.eventLink,
			description: eventDetails.eventDesc,
			position: 0,
			locations: eventDetails.eventLocations,
			length: eventDetails.eventDuration,
			hidden: false,
			eventName: eventDetails.eventName,
			periodType: eventSchedule.eventPeriodType as PeriodType,
			periodStartDate: eventSchedule.eventPeriodStartDate.toDate(),
			periodEndDate: eventSchedule.eventPeriodEndDate.toDate(),
			periodDays: eventSchedule.eventPeriodDays,
			periodCountCalendarDays: eventSchedule.eventPeriodCountCalendarDays === 1 ? true : false,
			requiresConfirmation: false,
			disableGuests: false,
			hideCalendarNotes: false,
			minimumBookingNotice: eventSchedule.eventMiniBNType === 'h' ? eventSchedule.eventMiniBN * 60 : eventSchedule.eventMiniBN,
			beforeEventBuffer: eventSchedule.eventBeforeBuffer,
			afterEventBuffer: eventSchedule.eventAfterBuffer,
			schedulingType: null,
			price: 0,
			currency: 'usd',
			slotInterval: eventSchedule.eventSlotInterval || null,
			metadata: "",
			successRedirectUrl: null,
			customInputs: eventBookingForm.eventCustomInputs,
			schedule: eventSchedule.eventIsNewAvailabliity === false && eventSchedule.eventPeriodAvailability !== null ? eventSchedule.eventPeriodAvailability : new_schedule.schedule.id,
		});
	};

	return (
		<MainLayout>
			<div className="block">
				<Steps
					style={{
						marginTop: 20,
						marginBottom: 20,
					}}
					current={current}
					labelPlacement="vertical"
				>
					{steps.map((item) => (
						<Step key={item.title} title={item.title} />
					))}
				</Steps>
				<StyledCard>
					<div className="steps-content">{steps[current].content}</div>
					<div
						className="steps-action"
						style={{
							display: "flex",
							justifyContent: "space-between",
						}}
					>
						{current > 0 ? (
							<Button
								type="primary"
								// color="primary"
								style={{ margin: "0 8px" }}
								onClick={() => prev()}
							>
								Back
							</Button>
						) : (
							<Link href="/event-types">
								<Button
									type="primary"
									// color="primary"
									style={{ margin: "0 8px" }}
								>
									Cancel
								</Button>
							</Link>
						)}
						{current < steps.length - 1 && (
							<Button type="primary" onClick={() => next()}>
								Next
							</Button>
						)}
						{current === steps.length - 1 && (
							<Button type="primary" onClick={() => complete()}>
								Save and Close
							</Button>
						)}
					</div>
				</StyledCard>
			</div>
		</MainLayout>
	);
};
export default CreateEvent;

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
	const { req, query } = context;
	const session = await getSession({ req });

	if (!session?.user?.id) {
		return {
			redirect: {
				permanent: false,
				destination: "/auth/login",
			},
		};
	}

	const userSelect = Prisma.validator<Prisma.UserSelect>()({
		name: true,
		username: true,
		id: true,
		avatar: true,
		email: true,
		plan: true,
		locale: true,
	});

	const credentials = await prisma.credential.findMany({
		where: {
			userId: session.user.id,
		},
		select: {
			id: true,
			type: true,
			key: true,
			userId: true
		},
	});

	const t = await getTranslation("en", "common");
	const integrations = getApps(credentials);
	const locationOptions = getLocationOptions(integrations, t);

	// const hasPaymentIntegration = hasIntegration(integrations, "stripe_payment");
	// const currency =
	//   (credentials.find((integration) => integration.type === "stripe_payment")?.key as unknown as StripeData)
	//     ?.default_currency || "usd";

	return {
		props: {
			credentials,
			session,
			integrations,
			locationOptions,
			// hasPaymentIntegration,
			// currency,
		},
	};
}