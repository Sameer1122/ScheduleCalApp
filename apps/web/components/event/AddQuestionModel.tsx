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
} from "antd";
import {
  TopText,
  DescriptionText,
  DescriptionTextFixed,
} from "@components/StyledTypography";
import { DeleteOutlined } from "@ant-design/icons";

const { Text } = Typography;
const { Option } = Select;
const QuestionModal = ({ index, questions, isModalVisible, handleOk, handleCancel, edit }: any) => {
  const [customInputObj, setCustomInputObj] = React.useState({
    id: -1,
    eventTypeId: -1,
    label: '',
    placeholder: '',
    type: 'TEXT', 
    required: true
  });
  React.useEffect(() => {
    if(index > -1 && questions.length > 0) {
      setCustomInputObj(questions[index]);
    } else {
      setCustomInputObj({
        id: -1,
        eventTypeId: -1,
        label: '',
        placeholder: '',
        type: 'TEXT', 
        required: true
      });
    }
  }, [index, questions])
  return (
    <>
      <Modal
        title={<TopText style={{ color: "#005C3E" }}>New Question</TopText>}
        visible={isModalVisible}
        onOk={() => handleOk(customInputObj, index)}
        onCancel={handleCancel}
        okText="Apply"
      >
        {/* <TopText style={{ color: "#005C3E" }}>Edit Question</TopText> */}
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
            Question*
          </Text>
          <Input 
            placeholder="Please share anything that will help prepare for our meeting." 
            value={customInputObj.label || ''} 
            onChange={(e: any) => setCustomInputObj({...customInputObj, label: e.target.value})}/>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 15,
          }}
        >
          {/* <Switch defaultChecked onChange={() => console.log()} /> */}
          <Checkbox 
            checked={customInputObj.required} 
            onChange={(e: any) => setCustomInputObj({...customInputObj, required: e.target.checked})}>Required</Checkbox>
        </div>{" "}
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
            Question*
          </Text>
          <Select
            style={{ width: "100%", marginBottom: 15 }}
            value={customInputObj.type}
            onChange={(value: any) => setCustomInputObj({...customInputObj, type: value})}
          >
            <Option value="TEXT">One Line</Option>
            <Option value="TEXTLONG">Multiple Lines</Option>
            {/* <Option value="3">Radio Buttons</Option> */}
            <Option value="BOOL">Checkboxes</Option>
            <Option value="NUMBER">Phone Number</Option>
          </Select>
        </div>
        {/* {edit && (
          <Button icon={<DeleteOutlined />} danger>
            {" "}
            Delete Question
          </Button>
        )} */}
      </Modal>
    </>
  );
};

export default QuestionModal;
