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
  Select,
  Tag,
  Divider,
} from "antd";
import styled from "styled-components";
import {
  TopText,
  DescriptionText,
} from "@components/StyledTypography";
import AddIcon from "@ant-design/icons/PlusOutlined";
import AddQuestionModel from "./AddQuestionModel";
import { XIcon } from "@heroicons/react/outline";

const { Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const CreateBookingForm = ({ eventBookingForm, setEventBookingForm }: any) => {
  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const [selectedQuestion, setSelectedQuestion] = React.useState(0);

  const showModal = (index: number) => {
    setIsModalVisible(true);
    setSelectedQuestion(index);
  };

  const handleOk = (customInputObj: any, index: number) => {
    setIsModalVisible(false);
    if (index == -1) {
      let customInputs = [...eventBookingForm.eventCustomInputs, customInputObj];
      setEventBookingForm({ ...eventBookingForm, eventCustomInputs: customInputs });
    } else {
      let customInputs = [...eventBookingForm.eventCustomInputs];
      customInputs[index] = customInputObj;
      setEventBookingForm({ ...eventBookingForm, eventCustomInputs: customInputs });
    }
  };

  const deleteCustomInput = (index: number) => {
    let customInputs = [...eventBookingForm.eventCustomInputs];
    customInputs.splice(index, 1);
    setEventBookingForm({ ...eventBookingForm, eventCustomInputs: customInputs });
  }

  const handleCancel = () => {
    setIsModalVisible(false);
  };
  const handleChange = (value: any) => {
    console.log(`selected ${value}`);
  };
  return (
    <>
      {isModalVisible && (
        <AddQuestionModel
          isModalVisible={isModalVisible}
          index={selectedQuestion}
          questions={eventBookingForm.eventCustomInputs}
          handleOk={handleOk}
          handleCancel={handleCancel}
        />
      )}
      <Space direction="vertical" style={{ width: "100%" }}>
        <TopText>Invitee Questions</TopText>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 20,
            width: "100%",
            //   marginBottom: 20,
          }}
        >
          <Text
            style={{
              zIndex: 101,
              backgroundColor: "white",
              color: "#3D3935",
              fontSize: 14,
              marginLeft: 8,
              maxWidth: "fit-content",
              // padding: 3,
              marginBottom: -10,
            }}
          >
            Name*
          </Text>
          <Input
            suffix={
              <Button
                // onClick={() => {
                //   setEdit(true);
                //   showModal();
                // }}
                type="link"
              >
                Edit
              </Button>
            }
            value={eventBookingForm.eventInviteeName}
            onChange={(e: any) => setEventBookingForm({ ...eventBookingForm, eventInviteeName: e.target.value })}
            placeholder="Please enter  name"
          />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Text
            style={{
              zIndex: 101,
              backgroundColor: "white",
              color: "#3D3935",
              fontSize: 14,
              marginLeft: 8,
              maxWidth: "fit-content",

              marginBottom: -10,
            }}
          // placeholder="Please enter email"
          >
            Email*
          </Text>
          <Input
            suffix={
              <Button
                // onClick={() => {
                //   setEdit(true);
                //   showModal();
                // }}
                type="link"
              >
                Edit
              </Button>
            }
            value={eventBookingForm.eventInviteeEmail}
            onChange={(e: any) => setEventBookingForm({ ...eventBookingForm, eventInviteeEmail: e.target.value })}
          />
        </div>
        <Tag>Add Guest</Tag>
        <div style={{ position: 'relative', marginTop: '10px' }}>
          <Text
            style={{
              zIndex: 101,
              backgroundColor: "white",
              color: "#3D3935",
              fontSize: 14,
              maxWidth: "fit-content",
              position: 'absolute',
              top: "-11px",
              left: "8px"
            }}
          >
            Leave Comment
          </Text>
          <TextArea
            showCount
            maxLength={1000}
            placeholder="Type here..."
            style={{ height: 50 }}
            value={eventBookingForm.eventInviteeComment}
            onChange={(e: any) => setEventBookingForm({ ...eventBookingForm, eventInviteeComment: e.target.value })}
          />
        </div>
        {
          eventBookingForm.eventCustomInputs.length > 0 &&
          <TopText>
            Questions
          </TopText>
        }
        {
          eventBookingForm.eventCustomInputs.length > 0 &&
          eventBookingForm.eventCustomInputs.map((el: any, index: number) => {
            return (
              <Row key={`custom-inputs-${index}`} className="bg-secondary-50 mb-2 border p-2">
                <Col span={20}>
                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                  }}>
                    <Space>
                      <Text>Label: </Text><Text>{el.label}</Text>
                    </Space>
                    {/* <Space>
                      <Text>Placeholder: </Text><Text>{el.placeholder}</Text>
                    </Space> */}
                    <Space>
                      <Text>Type: </Text><Text>{el.type}</Text>
                    </Space>
                    {
                      el.required && <Text>Required</Text>
                    }
                  </div>
                </Col>
                <Col span={4} style={{textAlign: 'right'}}>
                  <Space>
                    <Button
                      style={{padding: '0px'}}
                      onClick={() => showModal(index)}
                      type="link"
                    >
                      Edit
                    </Button>
                    <Button 
                      onClick={() => deleteCustomInput(index)}
                      style={{padding: '0px'}} 
                      type="link">
                      <XIcon className="h-6 w-6 border-l-2 pl-1 hover:text-red-500 " />
                    </Button>
                  </Space>
                </Col>
              </Row>
            )
          })
        }
        <Button
          onClick={() => showModal(-1)}
          style={{ marginBottom: 20 }}
          icon={<AddIcon />}
          type="link"
        >
          Add questions
        </Button>
      </Space>
    </>
  );
};
const timeOption = [
  "5 minutes",
  "10 minutes",
  "15 minutes",
  "20 minutes",
  "30 minutes",
  "45 minutes",
  "60 minutes (Default)",
  "90 minutes",
  "120 minutes",
  "150 minutes",
  "180 minutes",
  "210 minutes",
];
const locationOption = [
  "Microsoft Team (Default)",
  "Outlook",
  "Office 365",
  "Office",
];
export default CreateBookingForm;
