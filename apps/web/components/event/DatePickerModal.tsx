import React, { useState } from "react";
import {
  Modal,
  Button,
  Input,
  Typography,
  Switch,
  Space,
  Checkbox,
  Select,
  Divider,
  DatePicker,
} from "antd";
import {
  TopText,
  DescriptionText,
  DescriptionTextFixed,
} from "@components/StyledTypography";

import PlusOutlined from "@ant-design/icons/PlusOutlined";
import DeleteOutlined from "@ant-design/icons/DeleteOutlined";
const { RangePicker } = DatePicker;
const { Text } = Typography;
const { Option } = Select;
const DatePickerModal = ({ isModalVisible, handleOk, handleCancel, edit }: any) => {
  const onChange = (date: any, dateString: any) => {
    console.log(date, dateString);
  };
  return (
    <>
      <Modal
        title={
          <TopText style={{ color: "#005C3E" }}>
            Select the date(s) you want to assign specific hours
          </TopText>
        }
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        okText="Apply"
      >
        <DatePicker
          size="large"
          style={{ width: "100%" }}
          onChange={onChange}
        />
        <TopText style={{ color: "#005C3E", fontSize: 14, marginTop: 20 }}>
          What hours are you available?
        </TopText>
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <Space>
            <Select
              style={{ marginRight: 10, marginLeft: 10 }}
              defaultValue="02:00 PM"
            >
              {timeOption.map((item, index) => (
                <Option key={index} value={item}>
                  {item}
                </Option>
              ))}
            </Select>
            -
            <Select style={{ marginRight: 40 }} defaultValue="02:00 PM">
              {timeOption.map((item, index) => (
                <Option key={index} value={item}>
                  {item}
                </Option>
              ))}
            </Select>
          </Space>
          <Space>
            <PlusOutlined />
            <DeleteOutlined />
          </Space>
        </div>
      </Modal>
    </>
  );
};

export default DatePickerModal;

const timeOption = [
  "12:00 AM",
  "01:00 AM",
  "02:00 AM",
  "03:00 AM",
  "04:00 AM",
  "05:00 AM",
  "06:00 AM",
  "07:00 AM",
  "08:00 AM",
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
  "06:00 PM",
  "07:00 PM",
  "08:00 PM",
  "09:00 PM",
  "10:00 PM",
  "11:00 PM",
];
