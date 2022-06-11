import { ExclamationIcon } from "@heroicons/react/solid";
import { SchedulingType } from "@prisma/client";
import { Dayjs } from "dayjs";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { FC, useEffect, useState } from "react";

import { nameOfDay } from "@calcom/lib/weekday";

import classNames from "@lib/classNames";
import { useLocale } from "@lib/hooks/useLocale";
import { useSlots } from "@lib/hooks/useSlots";

import Loader from "@components/Loader";

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

type AvailableTimesProps = {
  minimumBookingNotice: number;
  beforeBufferTime: number;
  afterBufferTime: number;
  eventTypeId: number;
  eventLength: number;
  eventTypeSlug: string;
  slotInterval: number | null;
  currentTime: Dayjs | null;
  setCurrentTime: any;
  date: Dayjs;
  users: {
    username: string | null;
  }[];
  schedulingType: SchedulingType | null;
};

const AvailableTimes: FC<AvailableTimesProps> = ({
  date,
  eventLength,
  eventTypeId,
  eventTypeSlug,
  slotInterval,
  minimumBookingNotice,
  users,
  schedulingType,
  beforeBufferTime,
  afterBufferTime,
  currentTime,
  setCurrentTime,
}) => {
  const { t, i18n } = useLocale();
  const router = useRouter();
  const [isPM, setIsPM] = useState(false);
  const { rescheduleUid } = router.query;
  const { slots, loading, error } = useSlots({
    date,
    slotInterval,
    eventLength,
    schedulingType,
    users,
    minimumBookingNotice,
    beforeBufferTime,
    afterBufferTime,
    eventTypeId,
  });

  return (
    <>
      <Space style={{ width: "100%", marginTop: 10 }}>
        <Button
          style={{ width: 191 }}
          onClick={() => setIsPM(false)}
          type={isPM === false ? "primary" : ""}
        >
          AM
        </Button>
        <Button
          style={{ width: 191 }}
          onClick={() => setIsPM(true)}
          type={isPM === true ? "primary" : ""}
        >
          PM
        </Button>
      </Space>
      <Space size="large" className="mt-5 flex-wrap">
        {!loading &&
          slots?.length > 0 &&
          slots.map((slot) => {
            type BookingURL = {
              pathname: string;
              query: Record<string, string | number | string[] | undefined>;
            };
            const bookingUrl: BookingURL = {
              pathname: "book",
              query: {
                ...router.query,
                date: slot.time.format(),
                type: eventTypeId,
                slug: eventTypeSlug,
              },
            };

            if (rescheduleUid) {
              bookingUrl.query.rescheduleUid = rescheduleUid as string;
            }

            if (schedulingType === SchedulingType.ROUND_ROBIN) {
              bookingUrl.query.user = slot.users;
            }
            let a_format = slot.time.format('a');
            if (isPM == false && a_format == 'am') {
              return (
                <Button
                  key={slot.time.format()}
                  onClick={() => setCurrentTime(slot.time)}
                  type={currentTime && currentTime == slot.time ? "primary" : ""}
                  style={{ width: 79 }}
                >
                  {slot.time.format('h:mm')}
                </Button>
              )
            }

            if (isPM == true && a_format == 'pm') {
              return (
                <Button
                  key={slot.time.format()}
                  onClick={() => setCurrentTime(slot.time)}
                  type={currentTime && currentTime == slot.time ? "primary" : ""}
                  style={{ width: 79 }}
                >
                  {slot.time.format('h:mm')}
                </Button>
              )
            }

          })
        }
      </Space>
    </>
  );
};

export default AvailableTimes;
