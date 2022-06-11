import React from "react";
import {
  Steps,
  Button,
  message,
  Input,
  Typography,
  Space,
  Row,
  Col,
  Radio,
  Select,
  Divider,
  Checkbox,
  Collapse,
} from "antd";
import styled from "styled-components";
import {
  TopText,
  DescriptionText,
  DescriptionTextFixed,
} from "@components/StyledTypography";
import { Form } from "@calcom/ui/form/fields";
import { Controller, useForm } from "react-hook-form";
import AdditionalRule from "./AdditionalRule";
import CalendarTypeModal from "./CalendarTypeModal";
import DateRangePickerModal from "./DateRangePickerModal";
import DatePickerModal from "./DatePickerModal";
import { trpc } from "@lib/trpc";
import { inferSSRProps } from "@lib/types/inferSSRProps";
import { QueryCell } from "@lib/QueryCell";
import { Moment } from "moment";
import TimezoneSelect from "@components/ui/form/TimezoneSelect";
import NewSchedule from "@components/availability/NewSchedule";
import { DEFAULT_SCHEDULE, availabilityAsString } from "@calcom/lib/availability";

const { Text } = Typography;
const { Option } = Select;
const { Panel } = Collapse;

const AvailabilitySelect = ({value, onChange}: any) => {
  const query = trpc.useQuery(["viewer.availability.list"]);

  return (
    <QueryCell
      query={query}
      success={({ data }) => {
        const options = data.schedules.map((schedule) => ({
          value: schedule.id,
          label: schedule.name,
        }));
        if (value == null) {
          value = data.schedules.find((schedule) => schedule.isDefault)?.id
        }
        return (
          <Select
            style={{width: '150px'}}
            options={options}
            onChange={onChange}
            value={value}
          />
        );
      }}
    />
  );
};

const CreateSchedule = ({scheduleForm, eventSchedule, setEventSchedule}: any) => {  
  const [isPeriodCalendarModalVisible, setIsPeriodCalendarModalVisible] = React.useState(false);
  const [isRangeModalVisible, setIsRangeModalVisible] = React.useState(false);
  const [isModalVisible3, setIsModalVisible3] = React.useState(false);

  const handlePeriodTypeChange = (e: any) => {
    setEventSchedule({...eventSchedule, eventPeriodType: e.target.value});
  };
  const handlePeriodDaysChange = (e: any) => {
    const { value } = e.target;
    const reg = /^\d*?$/;
    if ((!isNaN(value) && reg.test(value)) || value === '' || value === '-') {
      setEventSchedule({...eventSchedule, eventPeriodDays: value});
    }
  }
  const handlePeriodCalendarOK = (value: number) => {
    setEventSchedule({...eventSchedule, eventPeriodCountCalendarDays: value});
    setIsPeriodCalendarModalVisible(false);
  };

  const handlePeriodCalendarCancel = () => {
    setIsPeriodCalendarModalVisible(false);
  };

  const handleRangeModalOK = (startDate: Moment, endDate: Moment) => {
    setEventSchedule({...eventSchedule, eventPeriodStartDate: startDate, eventPeriodEndDate: endDate});
    setIsRangeModalVisible(false);
  }

  const handleRangeModalCancel = () => {
    setIsRangeModalVisible(false);
  }

  const handleAvailablityChange = (e: any) => {
    setEventSchedule({...eventSchedule, eventPeriodAvailability: parseInt(e)});
  }
  return (
    <>
      {isPeriodCalendarModalVisible && (
        <CalendarTypeModal
          eventPeriodCountCalendarDays={eventSchedule.eventPeriodCountCalendarDays}
          isModalVisible={isPeriodCalendarModalVisible}
          handleOk={handlePeriodCalendarOK}
          handleCancel={handlePeriodCalendarCancel}
        />
      )}
      {isRangeModalVisible && (
        <DateRangePickerModal
          eventPeriodStartDate={eventSchedule.eventPeriodStartDate}
          eventPeriodEndDate={eventSchedule.eventPeriodEndDate}
          isModalVisible={isRangeModalVisible}
          handleOk={handleRangeModalOK}
          handleCancel={() => handleRangeModalCancel}
        />
      )}

      {isModalVisible3 && (
        <DatePickerModal
          isModalVisible={isModalVisible3}
          handleOk={() => setIsModalVisible3(false)}
          handleCancel={() => setIsModalVisible3(false)}
        />
      )}
      <Space direction="vertical" style={{ maxWidth: "100%" }}>
        <TopText>Date Range</TopText>
        <DescriptionText>
          Control how far out your clients can schedule
          <br />
          Set a range of dates when you can accept meetings.
        </DescriptionText>
        <Radio.Group style={{}} onChange={handlePeriodTypeChange} value={eventSchedule.eventPeriodType}>
          <Space direction="vertical" style={{ maxWidth: "100%" }}>
            {/* <Space> */}
            <Radio value={`ROLLING`}>
              <Input style={{ width: 60, marginRight: 15 }} value={eventSchedule.eventPeriodDays} onChange={handlePeriodDaysChange} maxLength={3}/>
              <Select onClick={() => setIsPeriodCalendarModalVisible(true)} value={eventSchedule.eventPeriodCountCalendarDays}>
                <Select.Option value={1}> Calendar Days</Select.Option>
                <Select.Option value={0}> Business Days</Select.Option>
              </Select>
            </Radio>

            <Radio onClick={() => setIsRangeModalVisible(true)} value={`RANGE`}>
              <DescriptionText> Withing a date range</DescriptionText>
            </Radio>
          </Space>
        </Radio.Group>
        <Divider />
        <TopText>
          How do you want to offer you availability for this event type?
        </TopText>
        <DescriptionText>
          Select one of your schedules or define custom hours specific to this
          type of event.
        </DescriptionText>
        <Space>
          <Button type={ eventSchedule.eventIsNewAvailabliity == false ? 'primary': 'default' } onClick={() => setEventSchedule({...eventSchedule, eventIsNewAvailabliity: false})}>Use an existing schedule </Button>
          <Button type={ eventSchedule.eventIsNewAvailabliity == true ? 'primary': 'default' } onClick={() => setEventSchedule({...eventSchedule, eventIsNewAvailabliity: true})}>Set custom hours</Button>
        </Space>
        <Divider />
        {
          eventSchedule.eventIsNewAvailabliity == false && 
          (
            <Space>
              {" "}
              <TopText style={{ fontSize: 14 }}>Availability</TopText>
              <AvailabilitySelect
                value={eventSchedule.eventPeriodAvailability}
                onChange={handleAvailablityChange}
              />{" "}
            </Space>
          )
        }
        {
          eventSchedule.eventIsNewAvailabliity == true &&
          (<>
            <TopText>Time Zone</TopText>
            {/* <DescriptionText>Central Standard Time</DescriptionText> */}
            <TimezoneSelect
              value={eventSchedule.eventTimeZone}
              className="focus:border-brand mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
              onChange={(timezone) => setEventSchedule({...eventSchedule, eventTimeZone: timezone.value})}
            />
            <Divider />
            <Row>
              <Col span={18} style={{ borderRight: "1px solid #EDEDED" }}>
                <Space style={{width: '100%', paddingRight: '5px'}} direction="vertical">
                  <DescriptionText>Set your weekly hours</DescriptionText>
                  <Form
                    form={scheduleForm}
                    handleSubmit={async (values) => {
                      console.log(values);
                    }}>
                      <NewSchedule name="schedule" />
                    </Form>
                </Space>
              </Col>
              <Col span={6}>
                <Space direction="vertical" style={{ paddingLeft: 10 }}>
                  <TopText>Add date overrides </TopText>
                  <DescriptionText>
                    Override your schedule on a specific date.
                  </DescriptionText>
                  <Button onClick={() => setIsModalVisible3(true)}>
                    Add a date override
                  </Button>
                </Space>
              </Col>
            </Row>
          </>)
        }
        <Divider />
        <TopText style={{ fontSize: 14 }}>
          Want to add time before or after your events?
        </TopText>
        <DescriptionText>
          Give yourself some buffer time to prepare for or wrap up from booked
          events.
        </DescriptionText>
        <Space>
          {" "}
          <TopText style={{ fontSize: 14 }}>Before Event</TopText>
          <Select
            className="w-[150px]"
            value={eventSchedule.eventBeforeBuffer}
            onChange={(value: any) => setEventSchedule({...eventSchedule, eventBeforeBuffer: parseInt(value)})}
          >
            {durationOption.map((item, index) => (
              <Option key={index} value={item.value}>
                {item.label}
              </Option>
            ))}
          </Select>{" "}
        </Space>
        <Space>
          {" "}
          <TopText style={{ fontSize: 14 }}>After Event</TopText>{" "}
          <Select
            className="w-[150px]"
            value={eventSchedule.eventAfterBuffer}
            onChange={(value: any) => setEventSchedule({...eventSchedule, eventAfterBuffer: parseInt(value)})}
          >
            {durationOption.map((item, index) => (
              <Option key={index} value={item.value}>
                {item.label}
              </Option>
            ))}
          </Select>{" "}
        </Space>
        <Divider />
        <Collapse
          style={{ marginTop: -20, marginBottom: 20 }}
          expandIconPosition="right"
          defaultActiveKey={["1"]}
          ghost
        >
          <Panel
            showArrow
            style={{ color: "#007A3E" }}
            header={
              <TopText style={{ fontSize: 14, color: "#007A3E" }}>
                Additional rules for your availability
              </TopText>
            }
            key="1"
          >
            <AdditionalRule eventSchedule={eventSchedule} setEventSchedule={setEventSchedule} />
          </Panel>
        </Collapse>
        {/* <Divider /> */}
      </Space>
    </>
  );
};

export default CreateSchedule;
const durationOption = [
  {label: "No buffer time", value: 0},
  {label: "5 minutes", value: 5},
  {label: "10 minutes", value: 10},
  {label: "15 minutes", value: 15},
  {label: "20 minutes", value: 20},
  {label: "30 minutes", value: 30},
  {label: "45 minutes", value: 45},
  {label: "60 minutes", value: 60},
  {label: "90 minutes", value: 90},
  {label: "120 minutes", value: 120},
  {label: "150 minutes", value: 150},
  {label: "180 minutes", value: 180},
  {label: "210 minutes", value: 210},
];
