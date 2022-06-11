import {
  CalendarIcon,
  ClockIcon,
  CreditCardIcon,
  ExclamationIcon,
  InformationCircleIcon,
} from "@heroicons/react/solid";
import { EventTypeCustomInputType } from "@prisma/client";
import { useContracts } from "contexts/contractsContext";
import dayjs from "dayjs";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { FormattedNumber, IntlProvider } from "react-intl";
import { ReactMultiEmail } from "react-multi-email";
import { useMutation } from "react-query";

import { useIsEmbed, useIsBackgroundTransparent } from "@calcom/embed-core";
import classNames from "@calcom/lib/classNames";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { HttpError } from "@calcom/lib/http-error";
import { createPaymentLink } from "@calcom/stripe/client";
// import { Button } from "@calcom/ui/Button";
import { EmailInput, Form } from "@calcom/ui/form/fields";

import { asStringOrNull } from "@lib/asStringOrNull";
import { timeZone } from "@lib/clock";
import { ensureArray } from "@lib/ensureArray";
import useTheme from "@lib/hooks/useTheme";
import { LocationType } from "@lib/location";
import createBooking from "@lib/mutations/bookings/create-booking";
import { parseDate } from "@lib/parseDate";
import slugify from "@lib/slugify";
import { collectPageParameters, telemetryEventTypes, useTelemetry } from "@lib/telemetry";

import CustomBranding from "@components/CustomBranding";
import AvatarGroup from "@components/ui/AvatarGroup";
import type PhoneInputType from "@components/ui/form/PhoneInput";

import { BookPageProps } from "../../../pages/[user]/book";
import { TeamBookingPageProps } from "../../../pages/team/[slug]/book";

import {
  Space,
  Select,
  Steps,
  message,
  Button,
  Input,
  Checkbox,
  Typography,
  Avatar,
  Row,
  Col,
  DatePicker,
} from "antd";
import styled from "styled-components";
import { TopText, DescriptionText } from "../../../components/StyledTypography";
import { RightOutlined, PlusOutlined } from "@ant-design/icons";
import ClockCircleOutlined from "@ant-design/icons/ClockCircleOutlined";

const StyledCard = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 40px;
  margin: 30px;
  width: 940px;
  background: #ffffff;
  box-shadow: 0px 4px 8px -2px rgba(16, 24, 40, 0.1),
    0px 2px 4px -2px rgba(16, 24, 40, 0.06);
`;

const { Text } = Typography;

/** These are like 40kb that not every user needs */
const PhoneInput = dynamic(
  () => import("@components/ui/form/PhoneInput")
) as unknown as typeof PhoneInputType;

type BookingPageProps = BookPageProps | TeamBookingPageProps;

type BookingFormValues = {
  name: string;
  email: string;
  notes?: string;
  locationType?: LocationType;
  guests?: string[];
  phone?: string;
  phone_number?: string;
  customInputs?: {
    [key: string]: string;
  };
};

const BookingPage = ({
  eventType,
  booking,
  profile,
  isDynamicGroupBooking,
  locationLabels,
}: BookingPageProps) => {
  const { t, i18n } = useLocale();
  const isEmbed = useIsEmbed();
  const router = useRouter();
  const { contracts } = useContracts();
  const { data: session } = useSession();
  const isBackgroundTransparent = useIsBackgroundTransparent();

  useEffect(() => {
    if (eventType.metadata.smartContractAddress) {
      const eventOwner = eventType.users[0];

      if (!contracts[(eventType.metadata.smartContractAddress || null) as number])
        /* @ts-ignore */
        router.replace(`/${eventOwner.username}`);
    }
  }, [contracts, eventType.metadata.smartContractAddress, router]);

  const mutation = useMutation(createBooking, {
    onSuccess: async (responseData) => {
      const { attendees, paymentUid } = responseData;
      if (paymentUid) {
        return await router.push(
          createPaymentLink({
            paymentUid,
            date,
            name: attendees[0].name,
            absolute: false,
          })
        );
      }

      const location = (function humanReadableLocation(location) {
        if (!location) {
          return;
        }
        if (location.includes("integration")) {
          return t("web_conferencing_details_to_follow");
        }
        return location;
      })(responseData.location);

      return router.push({
        pathname: "/success",
        query: {
          date,
          type: eventType.id,
          eventSlug: eventType.slug,
          user: profile.slug,
          reschedule: !!rescheduleUid,
          name: attendees[0].name,
          email: attendees[0].email,
          location,
          eventName: profile.eventName || "",
        },
      });
    },
  });

  const rescheduleUid = router.query.rescheduleUid as string;
  const { isReady, Theme } = useTheme(profile.theme);
  const date = asStringOrNull(router.query.date);

  const [guestToggle, setGuestToggle] = useState(booking && booking.attendees.length > 1);

  const eventTypeDetail = { isWeb3Active: false, ...eventType };

  type Location = { type: LocationType; address?: string; link?: string };
  // it would be nice if Prisma at some point in the future allowed for Json<Location>; as of now this is not the case.
  const locations: Location[] = useMemo(
    () => (eventType.locations as Location[]) || [],
    [eventType.locations]
  );

  useEffect(() => {
    if (router.query.guest) {
      setGuestToggle(true);
    }
  }, [router.query.guest]);

  const telemetry = useTelemetry();

  const locationInfo = (type: LocationType) => locations.find((location) => location.type === type);
  const loggedInIsOwner = eventType?.users[0]?.name === session?.user?.name;
  const guestListEmails = !isDynamicGroupBooking
    ? booking?.attendees.slice(1).map((attendee) => attendee.email)
    : [];

  const defaultValues = () => {
    if (!rescheduleUid) {
      return {
        name: loggedInIsOwner ? "" : session?.user?.name || (router.query.name as string) || "",
        email: loggedInIsOwner ? "" : session?.user?.email || (router.query.email as string) || "",
        phone_number: loggedInIsOwner ? "" : (router.query.phone_number as string) || "",
        notes: (router.query.notes as string) || "",
        guests: ensureArray(router.query.guest) as string[],
        customInputs: eventType.customInputs.reduce(
          (customInputs, input) => ({
            ...customInputs,
            [input.id]: router.query[slugify(input.label)],
          }),
          {}
        ),
      };
    }
    if (!booking || !booking.attendees.length) {
      return {};
    }
    const primaryAttendee = booking.attendees[0];
    if (!primaryAttendee) {
      return {};
    }
    return {
      name: primaryAttendee.name || "",
      email: primaryAttendee.email || "",
      phone_number: "",
      guests: guestListEmails,
      notes: booking.description || "",
    };
  };

  const bookingForm = useForm<BookingFormValues>({
    defaultValues: defaultValues(),
  });

  const selectedLocation = useWatch({
    control: bookingForm.control,
    name: "locationType",
    defaultValue: ((): LocationType | undefined => {
      if (router.query.location) {
        return router.query.location as LocationType;
      }
      if (locations.length === 1) {
        return locations[0]?.type;
      }
    })(),
  });

  const fullname = useWatch({
    control: bookingForm.control,
    name: "name",
    defaultValue: defaultValues().name
  })

  const email = useWatch({
    control: bookingForm.control,
    name: "email",
    defaultValue: defaultValues().email
  })

  const phone_number = useWatch({
    control: bookingForm.control,
    name: "phone_number",
    defaultValue: defaultValues().phone_number
  })
  const notes = useWatch({
    control: bookingForm.control,
    name: "notes",
    defaultValue: defaultValues().notes
  })

  const getLocationValue = (booking: Pick<BookingFormValues, "locationType" | "phone">) => {
    const { locationType } = booking;
    switch (locationType) {
      case LocationType.Phone: {
        return booking.phone || "";
      }
      case LocationType.InPerson: {
        return locationInfo(locationType)?.address || "";
      }
      case LocationType.Link: {
        return locationInfo(locationType)?.link || "";
      }
      // Catches all other location types, such as Google Meet, Zoom etc.
      default:
        return selectedLocation || "";
    }
  };
  useEffect(() => {
    console.log(bookingForm.formState.errors);
  }, [bookingForm.formState.errors]);

  const bookEvent = (booking: BookingFormValues) => {
    console.log('Submit?');
    telemetry.withJitsu((jitsu) =>
      jitsu.track(
        telemetryEventTypes.bookingConfirmed,
        collectPageParameters("/book", { isTeamBooking: document.URL.includes("team/") })
      )
    );

    // "metadata" is a reserved key to allow for connecting external users without relying on the email address.
    // <...url>&metadata[user_id]=123 will be send as a custom input field as the hidden type.

    // @TODO: move to metadata
    const metadata = Object.keys(router.query)
      .filter((key) => key.startsWith("metadata"))
      .reduce(
        (metadata, key) => ({
          ...metadata,
          [key.substring("metadata[".length, key.length - 1)]: router.query[key],
        }),
        {}
      );

    let web3Details;
    if (eventTypeDetail.metadata.smartContractAddress) {
      web3Details = {
        // @ts-ignore
        userWallet: window.web3.currentProvider.selectedAddress,
        userSignature: contracts[(eventTypeDetail.metadata.smartContractAddress || null) as number],
      };
    }

    mutation.mutate({
      ...booking,
      web3Details,
      start: dayjs(date).format(),
      end: dayjs(date).add(eventType.length, "minute").format(),
      eventTypeId: eventType.id,
      eventTypeSlug: eventType.slug,
      timeZone: timeZone(),
      language: i18n.language,
      rescheduleUid,
      user: router.query.user,
      location: getLocationValue(
        booking.locationType ? booking : { ...booking, locationType: selectedLocation }
      ),
      metadata,
      customInputs: Object.keys(booking.customInputs || {}).map((inputId) => ({
        label: eventType.customInputs.find((input) => input.id === parseInt(inputId))!.label,
        value: booking.customInputs![inputId],
      })),
    });
  };

  const disableInput = !!rescheduleUid;

  return (
    <div>
      <Theme />
      <Head>
        <title>
          {rescheduleUid
            ? t("booking_reschedule_confirmation", {
              eventTypeTitle: eventType.title,
              profileName: profile.name,
            })
            : t("booking_confirmation", {
              eventTypeTitle: eventType.title,
              profileName: profile.name,
            })}{" "}
          | Cal.com
        </title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <StyledCard>
        {isReady && (
          <Row gutter={40}>
            <Col span={12}>
              <Space direction="vertical">
                <Space>
                  {/* <AvatarGroup
                    border="border-2 dark:border-gray-800 border-white"
                    items={
                      [
                        { image: profile.image, alt: profile.name, title: profile.name },
                        ...eventType.users
                          .filter((user) => user.name !== profile.name)
                          .map((user) => ({
                            title: user.name,
                            alt: user.name,
                            image: `${process.env.NEXT_PUBLIC_WEBSITE_URL}/${user.username}/avatar.png`,
                          })),
                      ].filter((item) => !!item.image) as { image: string; alt?: string; title?: string }[]
                    }
                    size={10}
                    truncateAfter={3}
                  /> */}
                  <Avatar size={100} src={profile.image} />
                  <TopText style={{ color: "#005C3E", fontSize: 20 }}>
                    {profile.name}
                  </TopText>
                </Space>
                <TopText>{eventType.title}</TopText>
                {eventType?.description && (
                  <DescriptionText>{eventType.description}</DescriptionText>
                )}
                <TopText> Meeting Detail</TopText>
                <Space>
                  <ClockCircleOutlined style={{ color: "#007A3E" }} />
                  <DescriptionText>{eventType.length} {t("minutes")}</DescriptionText>
                </Space>
              </Space>
            </Col>
            <Col span={12}>
              <Space
                  direction="vertical"
                  style={{
                    width: "420px",
                  }}
                >
                <TopText>Confirm meeting</TopText>
                {/* <div style={{ height: 70 }} /> */}
                <DescriptionText>Please fill out your details below.</DescriptionText>
                <Form form={bookingForm} handleSubmit={bookEvent}>
                  <div
                    className="mb-2"
                    style={{
                      display: "flex",
                      flexDirection: "column",

                      width: "100%",
                      //   marginBottom: 20,
                    }}
                  >
                    <Text
                      style={{
                        zIndex: 1,
                        backgroundColor: "white",
                        color: "#3D3935",
                        fontSize: 14,
                        marginLeft: 8,
                        maxWidth: "fit-content",
                        // padding: 3,
                        marginBottom: -10,
                      }}
                    >
                      Full Name*
                    </Text>
                    <Input 
                      {...bookingForm.register("name", {required: true})}
                      type="text"
                      name="name"
                      id="name"
                      value={fullname}
                      onChange={(e: any) => bookingForm.setValue('name', e.target.value)}
                      status={bookingForm.formState.errors?.name ? 'error': ''}
                      disabled={disableInput}
                      placeholder="Please enter name" />
                    {
                      bookingForm.formState.errors?.name && 
                      <span>{bookingForm.formState.errors?.name.message}</span>
                    }
                  </div>
                  <div
                    className="mb-2"
                    style={{
                      display: "flex",
                      flexDirection: "column",

                      width: "100%",
                      //   marginBottom: 20,
                    }}
                  >
                    <Text
                      style={{
                        zIndex: 1,
                        backgroundColor: "white",
                        color: "#3D3935",
                        fontSize: 14,
                        marginLeft: 8,
                        maxWidth: "fit-content",
                        // padding: 3,
                        marginBottom: -10,
                      }}
                    >
                      Phone Number
                    </Text>
                    <Input 
                      {...bookingForm.register("phone_number")}
                      type="text"
                      name="phone_number"
                      id="phone_number"
                      value={phone_number}
                      onChange={(e: any) => bookingForm.setValue('phone_number', e.target.value)}
                      required
                      disabled={disableInput}
                      placeholder="Please enter phone number" />
                  </div>
                  <Space>
                    <Checkbox /> Send reminder text message{" "}
                  </Space>
                  <div
                    className="mb-2"
                    style={{
                      display: "flex",
                      flexDirection: "column",

                      width: "100%",
                      //   marginBottom: 20,
                    }}
                  >
                    <Text
                      style={{
                        zIndex: 1,
                        backgroundColor: "white",
                        color: "#3D3935",
                        fontSize: 14,
                        marginLeft: 8,
                        maxWidth: "fit-content",
                        // padding: 3,
                        marginBottom: -10,
                      }}
                    >
                      Email*
                    </Text>
                    <Input 
                      {...bookingForm.register("email", { required: true })}
                      type="email"
                      name="email"
                      id="email"
                      status={bookingForm.formState.errors?.email ? 'error': ''}
                      value={email}
                      onChange={(e: any) => bookingForm.setValue('email', e.target.value)}
                      disabled={disableInput}
                      placeholder="Please enter email" />
                    {
                      bookingForm.formState.errors?.email && 
                      <span>{bookingForm.formState.errors?.email.message}</span>
                    }
                  </div>
                  {locations.length > 1 && (
                    <div className="mb-4">
                      <span className="block text-sm font-medium text-gray-700 dark:text-white">
                        {t("location")}
                      </span>
                      {locations.map((location, i) => (
                        <label key={i} className="block">
                          <input
                            type="radio"
                            className="location h-4 w-4 border-gray-300 text-black focus:ring-black ltr:mr-2 rtl:ml-2"
                            {...bookingForm.register("locationType", { required: true })}
                            value={location.type}
                            defaultChecked={selectedLocation === location.type}
                            disabled={disableInput}
                          />
                          <span className="text-sm ltr:ml-2 rtl:mr-2 dark:text-gray-500">
                            {locationLabels[location.type]}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                  {selectedLocation === LocationType.Phone && (
                    <div className="mb-4">
                      <label
                        htmlFor="phone"
                        className="block text-sm font-medium text-gray-700 dark:text-white">
                        {t("phone_number")}
                      </label>
                      <div className="mt-1">
                        <PhoneInput<BookingFormValues>
                          control={bookingForm.control}
                          name="phone"
                          placeholder={t("enter_phone_number")}
                          id="phone"
                          required
                          disabled={disableInput}
                        />
                      </div>
                    </div>
                  )}
                  {eventType.customInputs
                    .sort((a, b) => a.id - b.id)
                    .map((input) => (
                      <div className="mb-4" key={input.id}>
                        {input.type !== EventTypeCustomInputType.BOOL && (
                          <label
                            htmlFor={"custom_" + input.id}
                            className="mb-1 block text-sm font-medium text-gray-700 dark:text-white">
                            {input.label}
                          </label>
                        )}
                        {input.type === EventTypeCustomInputType.TEXTLONG && (
                          <textarea
                            {...bookingForm.register(`customInputs.${input.id}`, {
                              required: input.required,
                            })}
                            id={"custom_" + input.id}
                            rows={3}
                            className={classNames(
                              "focus:border-brand block w-full rounded-sm border-gray-300 shadow-sm focus:ring-black dark:border-gray-900 dark:bg-gray-700 dark:text-white dark:selection:bg-green-500 sm:text-sm",
                              disableInput ? "bg-gray-200 dark:text-gray-500" : ""
                            )}
                            placeholder={input.placeholder}
                            disabled={disableInput}
                          />
                        )}
                        {input.type === EventTypeCustomInputType.TEXT && (
                          <input
                            type="text"
                            {...bookingForm.register(`customInputs.${input.id}`, {
                              required: input.required,
                            })}
                            id={"custom_" + input.id}
                            className="focus:border-brand block w-full rounded-sm border-gray-300 shadow-sm focus:ring-black dark:border-gray-900 dark:bg-gray-700 dark:text-white dark:selection:bg-green-500 sm:text-sm"
                            placeholder={input.placeholder}
                            disabled={disableInput}
                          />
                        )}
                        {input.type === EventTypeCustomInputType.NUMBER && (
                          <input
                            type="number"
                            {...bookingForm.register(`customInputs.${input.id}`, {
                              required: input.required,
                            })}
                            id={"custom_" + input.id}
                            className="focus:border-brand block w-full rounded-sm border-gray-300 shadow-sm focus:ring-black dark:border-gray-900 dark:bg-gray-700 dark:text-white dark:selection:bg-green-500 sm:text-sm"
                            placeholder=""
                          />
                        )}
                        {input.type === EventTypeCustomInputType.BOOL && (
                          <div className="flex h-5 items-center">
                            <input
                              type="checkbox"
                              {...bookingForm.register(`customInputs.${input.id}`, {
                                required: input.required,
                              })}
                              id={"custom_" + input.id}
                              className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black ltr:mr-2 rtl:ml-2"
                              placeholder=""
                            />
                            <label
                              htmlFor={"custom_" + input.id}
                              className="mb-1 block text-sm font-medium text-gray-700 dark:text-white">
                              {input.label}
                            </label>
                          </div>
                        )}
                      </div>
                    ))}
                  {!eventType.disableGuests && (
                    <div className="mb-4">
                      {!guestToggle && (
                        <Button icon={<PlusOutlined />} type="link" onClick={() => setGuestToggle(!guestToggle)}>
                          Add guest email
                        </Button>
                      )}
                      {guestToggle && (
                        <div>
                          <label
                            htmlFor="guests"
                            className="mb-1 mt-2 block text-sm font-medium text-gray-700 dark:text-white">
                            {t("guests")}
                          </label>
                          {!disableInput && (
                            <Controller
                              control={bookingForm.control}
                              name="guests"
                              render={({ field: { onChange, value } }) => (
                                <ReactMultiEmail
                                  className="relative"
                                  placeholder="guest@example.com"
                                  emails={value}
                                  onChange={onChange}
                                  getLabel={(
                                    email: string,
                                    index: number,
                                    removeEmail: (index: number) => void
                                  ) => {
                                    return (
                                      <div data-tag key={index} className="cursor-pointer">
                                        {email}
                                        {!disableInput && (
                                          <span data-tag-handle onClick={() => removeEmail(index)}>
                                            ×
                                          </span>
                                        )}
                                      </div>
                                    );
                                  }}
                                />
                              )}
                            />
                          )}
                          {/* Custom code when guest emails should not be editable */}
                          {disableInput && guestListEmails && guestListEmails.length > 0 && (
                            <div data-tag className="react-multi-email">
                              {/* // @TODO: user owners are appearing as guest here when should be only user input */}
                              {guestListEmails.map((email, index) => {
                                return (
                                  <div key={index} className="cursor-pointer">
                                    <span data-tag>{email}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  <div
                    className="mb-2"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      width: "100%",
                      marginBottom: 20,
                    }}
                  >
                    <Text
                      style={{
                        zIndex: 1,
                        backgroundColor: "white",
                        color: "#3D3935",
                        fontSize: 14,
                        marginLeft: 8,
                        maxWidth: "fit-content",
                        // padding: 3,
                        marginBottom: -10,
                      }}
                    >
                      Leave Comment*
                    </Text>
                    <Input.TextArea
                      //   multiple
                      //   style={{
                      //     height: 80,
                      //     display: "flex",
                      //     alignSelf: "flex-start",
                      //     justifySelf: "flex-start",
                      //     justifyContent: "flex-start",
                      //     alignItems: "flex-start",
                      //     paddingTop: 0,
                      //   }}
                      {...bookingForm.register("notes")}
                      id="notes"
                      name="notes"
                      value={notes}
                      onChange={(e: any) => bookingForm.setValue('notes', e.target.value)}
                      rows={3}
                      disabled={disableInput}
                      placeholder="Type here..."
                    />
                  </div>
                  <div
                    className="steps-action"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <Button type="primary" onClick={() => router.back()}>
                      {t("cancel")}
                    </Button>
                    <Button
                      type="primary"
                      htmlType="submit"
                      data-testid={rescheduleUid ? "confirm-reschedule-button" : "confirm-book-button"}
                      loading={mutation.isLoading}>
                      Schedule Meeting
                    </Button>
                  </div>
                </Form>
                {mutation.isError && (
                  <div
                    data-testid="booking-fail"
                    className="mt-2 border-l-4 border-yellow-400 bg-yellow-50 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <ExclamationIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                      </div>
                      <div className="ltr:ml-3 rtl:mr-3">
                        <p className="text-sm text-yellow-700">
                          {rescheduleUid ? t("reschedule_fail") : t("booking_fail")}{" "}
                          {(mutation.error as HttpError)?.message}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </Space>
            </Col>
          </Row>
        )}
      </StyledCard>
    </div>
  );
};

export default BookingPage;
