import React from "react";
import {
	Layout,
	Menu,
	Breadcrumb,
	Image,
	Button,
	Typography,
	Select,
} from "antd";
import styled from "styled-components";
import UserOutlined from "@ant-design/icons/UserOutlined";


const { Header, Content, Footer } = Layout;
const { Text } = Typography;
const { Option } = Select;

function UnAuthLayout(props: {
	children?: React.ReactNode;
}): JSX.Element {
	return (
		<Layout style={{ minHeight: "100vh" }}>
			<StyledHeader>
				<Image src={`${process.env.NEXT_PUBLIC_WEBSITE_URL}/custom/logocountry.svg`} />
				<HelpButton>
					<HelpText>Need Help? </HelpText>
				</HelpButton>
			</StyledHeader>

			<Content
				style={{
					padding: "0 20px",
					display: "flex",
					width: "100%",
					height: "100%",
					justifyContent: "center",
          alignItems: "center",
				}}
			>
				{props.children}
			</Content>
			<Footer style={{ textAlign: "center" }}>
				Powered by The Hypo Group
			</Footer>
		</Layout>
	)
}

const HelpText = styled(Text)`
  font-style: normal;
  font-weight: 400;
  font-size: 16px;
  line-height: 24px;

  color: #3d3935;

  flex: none;
  order: 0;
  flex-grow: 0;
  margin: 0px 8px;
`;

const AccountButton = styled(Menu)`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 10px 18px;
  position: static;
  margin-left: 10px;
  /* margin-right: 10px; */
  /* background: #ffffff; */
  border: 1px solid #005c3e;
  /* box-sizing: border-box; */
  /* box-shadow: 0px 1px 2px rgba(16, 24, 40, 0.05); */
  border-radius: 8px;
  height: 33px;
`;

const HelpButton = styled(Button)`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 10px 18px;
  position: static;
  margin-left: 10px;
  /* margin-right: 10px; */
  /* background: #ffffff; */
  /* border: 1px solid #005c3e; */
  /* box-sizing: border-box; */
  /* box-shadow: 0px 1px 2px rgba(16, 24, 40, 0.05); */
  border-radius: 8px;
`;

const StyledHeader = styled(Header)`
  background: #fff;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 24px 112px;
  background: #ffffff;
  width: 100%;
  position: static;
  height: 92px;
  box-shadow: 0px 1px 3px rgba(16, 24, 40, 0.1),
    0px 1px 2px rgba(16, 24, 40, 0.06);
  justify-content: space-between;
  align-items: center;
`;

export default UnAuthLayout;