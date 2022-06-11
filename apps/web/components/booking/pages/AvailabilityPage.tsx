// Get router variables
import {
  ArrowLeftIcon,
  CalendarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon,
  CreditCardIcon,
  GlobeIcon,
  InformationCircleIcon,
} from "@heroicons/react/solid";
import * as Collapsible from "@radix-ui/react-collapsible";
import { useContracts } from "contexts/contractsContext";
import dayjs, { Dayjs } from "dayjs";
import dayjsBusinessTime from "dayjs-business-time";
import timezone from "dayjs/plugin/timezone";
import customParseFormat from "dayjs/plugin/customParseFormat";
import utc from "dayjs/plugin/utc";
import getSlots from "@lib/slots";

import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { EventType, PeriodType } from "@prisma/client";

import { useEmbedStyles, useIsEmbed, useIsBackgroundTransparent, sdkActionManager } from "@calcom/embed-core";
import classNames from "@calcom/lib/classNames";
import { useLocale } from "@calcom/lib/hooks/useLocale";

import { asStringOrNull } from "@lib/asStringOrNull";
import { timeZone } from "@lib/clock";
import { BASE_URL } from "@lib/config/constants";
import { useExposePlanGlobally } from "@lib/hooks/useExposePlanGlobally";
import useTheme from "@lib/hooks/useTheme";
import { isBrandingHidden } from "@lib/isBrandingHidden";
import { parseDate } from "@lib/parseDate";
import AvailableTimes from "@components/booking/AvailableTimes";
import { collectPageParameters, telemetryEventTypes, useTelemetry } from "@lib/telemetry";

import TimeOptions from "@components/booking/TimeOptions";
import { HeadSeo } from "@components/seo/head-seo";
import { SchedulingType } from "@prisma/client";

import {
  Space,
  Select,
  Steps,
  message,
  Button,
  Typography,
  Avatar,
  Row,
  Col,
  DatePicker,
} from "antd";
import styled from "styled-components";
import { TopText, DescriptionText } from "../../../components/StyledTypography";
import ClockCircleOutlined from "@ant-design/icons/ClockCircleOutlined";
import moment from "moment";

import { AvailabilityPageProps } from "../../../pages/[user]/availability";
import { AvailabilityTeamPageProps } from "../../../pages/team/[slug]/[type]";

dayjs.extend(dayjsBusinessTime);
dayjs.extend(utc);
dayjs.extend(customParseFormat);
dayjs.extend(timezone);

type Props = AvailabilityTeamPageProps | AvailabilityPageProps;
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


const AvailabilityPage = ({ profile, plan, eventType, workingHours, previousPage, booking }: Props) => {
  const router = useRouter();
  const isEmbed = useIsEmbed();
  const { rescheduleUid } = router.query;
  const { isReady, Theme } = useTheme(profile.theme);
  const { t, i18n } = useLocale();
  const { contracts } = useContracts();
  const [currentTime, setCurrentTime] = useState<Dayjs | null>(null);

  useExposePlanGlobally(plan);
  useEffect(() => {
    if (eventType.metadata.smartContractAddress) {
      const eventOwner = eventType.users[0];
      if (!contracts[(eventType.metadata.smartContractAddress || null) as number])
        router.replace(`/${eventOwner.username}`);
    }
  }, [contracts, eventType.metadata.smartContractAddress, router]);

  const selectedDate = useMemo(() => {
    const dateString = asStringOrNull(router.query.date);
    if (dateString) {
      const offsetString = dateString.substr(11, 14); // hhmm
      const offsetSign = dateString.substr(10, 1); // + or -

      const offsetHour = offsetString.slice(0, -2);
      const offsetMinute = offsetString.slice(-2);

      const utcOffsetInMinutes =
        (offsetSign === "-" ? -1 : 1) *
        (60 * (offsetHour !== "" ? parseInt(offsetHour) : 0) +
          (offsetMinute !== "" ? parseInt(offsetMinute) : 0));

      const date = dayjs(dateString.substr(0, 10)).utcOffset(utcOffsetInMinutes, true);
      return date.isValid() ? date : null;
    }
    return null;
  }, [router.query.date]);

  if (selectedDate) {
    // Let iframe take the width available due to increase in max-width
    sdkActionManager?.fire("__refreshWidth", {});
  }

  const [isTimeOptionsOpen, setIsTimeOptionsOpen] = useState(false);

  const telemetry = useTelemetry();

  useEffect(() => {
    telemetry.withJitsu((jitsu) =>
      jitsu.track(
        telemetryEventTypes.pageView,
        collectPageParameters("availability", { isTeamBooking: document.URL.includes("team/") })
      )
    );
  }, [telemetry]);

  const changeDate = (newDate: any) => {
    if(newDate) {
      router.replace(
        {
          query: {
            ...router.query,
            date: newDate.format("YYYY-MM-DDZZ"),
          },
        },
        undefined,
        {
          shallow: true,
        }
      );
    }
  };

  const handleSelectTimeZone = (selectedTimeZone: string): void => {
    if (selectedDate) {
      changeDate(selectedDate.tz(selectedTimeZone, true));
    }
    timeZone(selectedTimeZone);
    setIsTimeOptionsOpen(false);
  };

  const disableDates = (current: any): boolean => {
    let date = dayjs(current.format('YYYY-MM-DD')).tz(timeZone());
    switch (eventType.periodType) {
      case PeriodType.ROLLING: {
        const periodRollingEndDay = eventType.periodCountCalendarDays
          ? dayjs().utcOffset(date.utcOffset()).add(eventType.periodDays!, "days").endOf("day")
          : dayjs().utcOffset(date.utcOffset()).addBusinessTime(eventType.periodDays!, "days").endOf("day");
        return dayjs(date).endOf("day").isAfter(periodRollingEndDay)
          ||
          !getSlots({
            inviteeDate: date,
            frequency: eventType.length,
            minimumBookingNotice: eventType.minimumBookingNotice,
            workingHours,
            eventLength: eventType.length,
          }).length;
      }

      case PeriodType.RANGE: {
        const periodRangeStartDay = dayjs(eventType.periodStartDate).utcOffset(date.utcOffset()).endOf("day");
        const periodRangeEndDay = dayjs(eventType.periodEndDate).utcOffset(date.utcOffset()).endOf("day");
        return date.endOf("day").isBefore(periodRangeStartDay) || date.endOf("day").isAfter(periodRangeEndDay)
          ||
          !getSlots({
            inviteeDate: date,
            frequency: eventType.length,
            minimumBookingNotice: eventType.minimumBookingNotice,
            workingHours,
            eventLength: eventType.length,
          }).length;
      }

      case PeriodType.UNLIMITED:
      default:
        return false;
    }
  }

  const next = () => {
    type BookingURL = {
      pathname: string;
      query: Record<string, string | number | string[] | undefined>;
    };
    const bookingUrl: BookingURL = {
      pathname: "book",
      query: {
        ...router.query,
        date: currentTime?.format() || '',
        type: eventType.id,
        slug: eventType.slug,
      },
    };

    if (rescheduleUid) {
      bookingUrl.query.rescheduleUid = rescheduleUid as string;
    }
    router.push(bookingUrl);

    // if (eventType.schedulingType === SchedulingType.ROUND_ROBIN) {
    //   bookingUrl.query.user = eventType.users;
    // }
  }

  return (
    <>
      <Theme />
      <HeadSeo
        title={`${rescheduleUid ? t("reschedule") : ""} ${eventType.title} | ${profile.name}`}
        description={`${rescheduleUid ? t("reschedule") : ""} ${eventType.title}`}
        name={profile.name || undefined}
        username={profile.slug || undefined}
      // avatar={profile.image || undefined}
      />
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
                  maxWidth: "420px",
                }}
              >
                <TopText style={{ paddingBottom: 100 }}>Select Date</TopText>
                {/* <div style={{ height: 70 }} /> */}
                <DescriptionText>
                  View available dates below. After you select your date, pick from the
                  list of available times on that date.
                </DescriptionText>
                <DatePicker
                  disabledDate={(current: any) => {
                    return disableDates(current)
                  }}
                  value={moment(selectedDate?.format('YYYY-MM-DD'))}
                  onChange={changeDate}
                  placeholder={moment().format("dddd, MMMM, DD, YYYY").toString()}
                  style={{ width: "100%" }}
                />
                <TopText>What time works best?</TopText>
                <TimezoneDropdown />
                {selectedDate && (
                  <AvailableTimes
                    minimumBookingNotice={eventType.minimumBookingNotice}
                    eventTypeId={eventType.id}
                    eventTypeSlug={eventType.slug}
                    slotInterval={eventType.slotInterval}
                    eventLength={eventType.length}
                    date={selectedDate}
                    currentTime={currentTime}
                    setCurrentTime={setCurrentTime}
                    users={eventType.users}
                    schedulingType={eventType.schedulingType ?? null}
                    beforeBufferTime={eventType.beforeEventBuffer}
                    afterBufferTime={eventType.afterEventBuffer}
                  />
                )}
                <div
                  className="steps-action mt-3"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <Button
                    type="primary"
                    // color="primary"
                    style={{ margin: "0 8px" }}
                    onClick={() => router.back()}
                  >
                    Back
                  </Button>
                
                  <Button type="primary" onClick={() => next()} disabled={currentTime == null}>
                    Next
                  </Button>
                </div>
              </Space>
            </Col>
          </Row>
        )}
      </StyledCard>
    </>
  );

  function TimezoneDropdown() {
    return (
      <Collapsible.Root open={isTimeOptionsOpen} onOpenChange={setIsTimeOptionsOpen}>
        <Collapsible.Trigger className="min-w-32 mb-1 -ml-2 px-2 py-1 text-left text-gray-600 dark:text-white">
          <GlobeIcon className="mr-[10px] ml-[2px] -mt-1 inline-block h-4 w-4 text-gray-400" />
          {timeZone()}
          {isTimeOptionsOpen ? (
            <ChevronUpIcon className="ml-1 -mt-1 inline-block h-4 w-4" />
          ) : (
            <ChevronDownIcon className="ml-1 -mt-1 inline-block h-4 w-4" />
          )}
        </Collapsible.Trigger>
        <Collapsible.Content>
          <TimeOptions onSelectTimeZone={handleSelectTimeZone} />
        </Collapsible.Content>
      </Collapsible.Root>
    );
  }
};

export default AvailabilityPage;
