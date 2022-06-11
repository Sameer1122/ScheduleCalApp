import { CalendarIcon } from "@heroicons/react/outline";
import { useRouter } from "next/router";
import React, { Fragment } from "react";

import { WipeMyCalActionButton } from "@calcom/app-store/wipemycalother/components";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { Alert } from "@calcom/ui/Alert";
// import Button from "@calcom/ui/Button";

import { useInViewObserver } from "@lib/hooks/useInViewObserver";
import { inferQueryInput, trpc } from "@lib/trpc";

import BookingsShell from "@components/BookingsShell";
import EmptyScreen from "@components/EmptyScreen";
import Loader from "@components/Loader";
import Shell from "@components/Shell";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import BookingListItem from "@components/booking/BookingListItem";
import BookingDetailModal from "@components/booking/BookingDetailModal";
import BookingCancel from "@components/booking/BookingCancelModal";
import Report from "@components/booking/BookingReports";
import Link from "next/link";

import {
  Avatar,
  Button,
  Space,
  Typography,
  Input,
  Select,
  Menu,
  Table,
  Tag,
} from "antd";
import { TopText, DescriptionText } from "@components/StyledTypography";
import { EyeOutlined, CloseOutlined, RedoOutlined } from "@ant-design/icons";
import MainLayout from "@components/layout/main";

type BookingListingStatus = inferQueryInput<"viewer.bookings">["status"] | "reports";

dayjs.extend(utc);
dayjs.extend(timezone);

export default function Bookings() {
  const router = useRouter();
  const status = router.query?.status as BookingListingStatus;

  const [viewModal, setViewModal] = React.useState(false);
  const [cancelModal, setCancelModal] = React.useState(false);
  const [selectedBooking, setSelectedBooking] = React.useState<any>(null);

  const columns = [
    {
      title: "Event Name",
      dataIndex: "name",
      key: "name",
      render: (text: string) => <DescriptionText>{text}</DescriptionText>,
    },
    {
      title: "Visitors",
      dataIndex: "visitors",
      key: "visitors",
      render: (text: string) => <DescriptionText>{text}</DescriptionText>,
    },
    {
      title: "Durations",
      dataIndex: "duration",
      key: "duration",
      render: (text: any) => <DescriptionText>{text}</DescriptionText>,
    },
    {
      title: "Date & Time",
      dataIndex: "date",
      key: "date",
      render: (text: any) => <DescriptionText>{ dayjs(text).format('ddd, MMM D, YYYY h:mm A') }</DescriptionText>,
    },
    {
      title: "Location",
      key: "location",
      dataIndex: "location",
      render: (text: any) => (
        <DescriptionText
          style={{ color: text === "Virtual" ? "#007A3E" : "#3D3935" }}
        >
          {text}
        </DescriptionText>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (text: any, record: any) => (
        <Space size="small">
          <EyeOutlined onClick={() => {
            console.log(record);
            setSelectedBooking(record);
            setViewModal(true);
          }} /> 
          <Link href={`/reschedule/${record.uid}`}>
            <RedoOutlined />
          </Link>
          <Link href={`/cancel/${record.uid}`}>
            <CloseOutlined />
          </Link>
        </Space>
      ),
    },
  ];

  const { t } = useLocale();

  const descriptionByStatus: Record<BookingListingStatus, string> = {
    upcoming: t("upcoming_bookings"),
    past: t("past_bookings"),
    cancelled: t("cancelled_booking"),
    reports: ""
  };

  const query = trpc.useInfiniteQuery(["viewer.bookings", { status, limit: 10 }], {
    // first render has status `undefined`
    enabled: !!status,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const buttonInView = useInViewObserver(() => {
    if (!query.isFetching && query.hasNextPage && query.status === "success") {
      query.fetchNextPage();
    }
  });

  const isEmpty = !query.data?.pages[0]?.bookings.length;

  let rData:any[] = []
  query.data?.pages.forEach((e: any) => {
    e.bookings.forEach((booking:any) => {
      rData.push({
        ...booking,
        'name': booking.title,
        'visitors': booking.attendees[0].name,
        'duration': booking.eventType.length,
        'date': booking.startTime,
        'location': booking.location
      })
    })
  })

  return (
    <MainLayout>
      <Shell heading={t("bookings")} subtitle={t("bookings_description")}>
        <BookingsShell>
          <div className="-mx-4 flex flex-col sm:mx-auto">
            <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                {query.status === "error" && (
                  <Alert severity="error" title={t("something_went_wrong")} message={query.error.message} />
                )}
                {(query.status === "loading" || query.status === "idle") && <Loader />}
                {query.status === "success" && !isEmpty && status != 'reports' && (
                  <>
                    <div className="mt-6 overflow-hidden rounded-sm border border-b border-gray-200">
                      {viewModal && selectedBooking && (
                        <BookingDetailModal
                          booking={selectedBooking}
                          isModalVisible={viewModal}
                          handleOk={() => setViewModal(false)}
                          handleCancel={() => setViewModal(false)}
                        />
                      )}
                      {/* {cancelModal && selectedBooking && (
                        <BookingCancel
                          isModalVisible={cancelModal}
                          handleOk={() => cancelBooking()}
                          handleCancel={() => setCancelModal(false)}
                        />
                      )} */}
                      <Table columns={columns} dataSource={rData} pagination={false} />
                    </div>
                    <div className="p-4 text-center" ref={buttonInView.ref}>
                      <Button
                        loading={query.isFetchingNextPage}
                        disabled={!query.hasNextPage}
                        onClick={() => query.fetchNextPage()}>
                        {query.hasNextPage ? t("load_more_results") : t("no_more_results")}
                      </Button>
                    </div>
                  </>
                )}
                {query.status === "success" && isEmpty && status != 'reports' && (
                  // <EmptyScreen
                  //   Icon={CalendarIcon}
                  //   headline={t("no_status_bookings_yet", { status: t(status) })}
                  //   description={t("no_status_bookings_yet_description", {
                  //     status: t(status),
                  //     description: descriptionByStatus[status],
                  //   })}
                  // />
                  <div className="flex flex-col justify-center items-center p-[40px] h-[60vh]" style={{border: "1px dashed #736b63", boxShadow: "0px 4px 8px -2px rgba(16, 24, 40, 0.1), 0px 2px 4px -2px rgba(16, 24, 40, 0.06)"}}>
                    <TopText style={{ textAlign: "center" }}>
                      There is no {status} bookings!
                    </TopText>
                    <DescriptionText style={{ textAlign: "center" }}>
                      {descriptionByStatus[status]}
                    </DescriptionText>
                  </div>
                )}
                {
                  query.status === "success" && status == 'reports' && (
                    <Report />
                  )
                }
              </div>
            </div>
          </div>
        </BookingsShell>
      </Shell>
    </MainLayout>
  );
}
