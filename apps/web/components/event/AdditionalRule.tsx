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

const { Option } = Select;

const AdditionalRule = ({ eventSchedule, setEventSchedule }: any) => {
  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <TopText>Start time Increments</TopText>
      <DescriptionText>
        Set the frequency of available time slots for invitees.
      </DescriptionText>
      <DescriptionText>
        Show available start times in increments of
      </DescriptionText>
      <Select
        style={{ width: "100%" }}
        value={eventSchedule.eventSlotInterval}
        onChange={(value: any) => setEventSchedule({ ...eventSchedule, eventSlotInterval: parseInt(value) })}
      >
        {durationOption.map((item, index) => (
          <Option key={index} value={item.value}>
            {item.label}
          </Option>
        ))}
      </Select>{" "}
      <Divider />
      <TopText>Scheduling conditions</TopText>
      <DescriptionText>
        Set the minimum amount of notice that is required and how many events
        are allowed per day.
      </DescriptionText>
      <DescriptionText>Invitees can't schedule within..</DescriptionText>
      <Space>
        <Input style={{ width: 40 }} maxLength={2} value={eventSchedule.eventMiniBN} onChange={(e: any) => {
          const { value } = e.target;
          const reg = /^\d*?$/;
          if ((!isNaN(value) && reg.test(value)) || value === '' || value === '-') {
            setEventSchedule({ ...eventSchedule, eventMiniBN: value })
          }
        }} />{" "}
        <Select
          value={eventSchedule.eventMiniBNType}
          style={{ width: "100%" }}
          onChange={(value: any) => setEventSchedule({ ...eventSchedule, eventMiniBNType: value })}
        >
          <Option value="h">Hours</Option>
          <Option value="m">Minutes</Option>
        </Select>
        <DescriptionText>of an event start time.</DescriptionText>
      </Space>
      <DescriptionText>
        Maximum allowed events per day for this type of event
      </DescriptionText>
      <Input style={{ width: 120 }} value={eventSchedule.eventMiniBNCount} onChange={(e: any) => {
        const { value } = e.target;
        const reg = /^\d*?$/;
        if ((!isNaN(value) && reg.test(value)) || value === '' || value === '-') {
          setEventSchedule({ ...eventSchedule, eventMiniBNCount: value })
        }
      }} />
      <Divider />
      <TopText>Time Zone Display</TopText>
      <div style={{ maxWidth: 620 }}>
        <DescriptionText>
          If you're meeting in person, you should lock this to the time zone of
          your event location. Otherwise, we detect time zones to make sure
          everyone meets at the correct time.
        </DescriptionText>
      </div>
      <Radio.Group style={{}} onChange={(e: any) => setEventSchedule({...eventSchedule, eventLockTimeZone: e.target.value})} value={eventSchedule.eventLockTimeZone}>
        <Space direction="vertical" style={{ maxWidth: "100%" }}>
          {/* <Space> */}
          <Radio value={false}>
            {" "}
            <DescriptionText>
              Automatically detect and show the times in my invitee's time zone
            </DescriptionText>
          </Radio>

          <Radio value={true}>
            <DescriptionText>
              {" "}
              Lock the timezone (best for in-person events)
            </DescriptionText>
          </Radio>
        </Space>
      </Radio.Group>
    </Space>
  );
};

const durationOption = [
  { label: "Use event length (default)", value: 0 },
  { label: "5 minutes", value: 5 },
  { label: "10 minutes", value: 10 },
  { label: "15 minutes", value: 15 },
  { label: "20 minutes", value: 20 },
  { label: "30 minutes", value: 30 },
  { label: "45 minutes", value: 45 },
  { label: "60 minutes", value: 60 },
  { label: "90 minutes", value: 90 },
  { label: "120 minutes", value: 120 },
  { label: "150 minutes", value: 150 },
  { label: "180 minutes", value: 180 },
  { label: "210 minutes", value: 210 },
];


export default AdditionalRule;
