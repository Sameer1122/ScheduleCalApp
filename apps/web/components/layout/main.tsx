import React from "react";
import {
	Space,
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
import Link from "next/link";
import { trpc } from "@lib/trpc";
import { SessionContextValue, signOut, useSession } from "next-auth/react";


const { Header, Content, Footer } = Layout;
const { Text } = Typography;
const { Option } = Select;

export function useMeQuery() {
  const meQuery = trpc.useQuery(["viewer.me"], {
    retry(failureCount) {
      return failureCount > 3;
    },
  });

  return meQuery;
}

function MainLayout(props: {
	children?: React.ReactNode;
}): JSX.Element {
	const query = useMeQuery();
  const user = query.data;

	return (
		<Layout style={{ minHeight: "100vh" }}>
			<StyledHeader>
				<Image src={`${process.env.NEXT_PUBLIC_WEBSITE_URL}/custom/logocountry.svg`} />
				<div style={{ display: "flex" }}>
					{" "}
					<Link href="/">
						<HelpButton type="text">
							<HelpText>Dashboard </HelpText>
						</HelpButton>
					</Link>
					<Link href="/event-types">
						<HelpButton type="text">
							<HelpText>Events </HelpText>
						</HelpButton>
					</Link>
					<Link href="/bookings">
						<HelpButton type="text">
							<HelpText>Bookings </HelpText>
						</HelpButton>
					</Link>
					{" "}

					{/* <HelpButton type="default" onClick={() => dispatch(logOut())}>
              <HelpText>Account </HelpText>
            </HelpButton> */}
					<AccountButton>
						{/* <Menu style={{}}> */}
						<Menu.SubMenu
							style={{ borderColor: "gray" }}
							key="SubMenu"
							title="Account"
						// icon={<SettingOutlined />}
						>
							{/* <Menu.ItemGroup title="Item 1"> */}
							<Menu.Item key="app">
								<Space>
									<img
										className="rounded-full w-[40px] h-[40px]"
										src={process.env.NEXT_PUBLIC_WEBSITE_URL + "/" + user?.username + "/avatar.png"}
										alt={user?.username || "Nameless User"}
									/>
									{user?.username || "Nameless User"}
								</Space>
							</Menu.Item>
							<Menu.Item
								key="viewProfile"
							>
								View Profile
							</Menu.Item>
							<Menu.Item key="integra">Integration</Menu.Item>
							<Menu.Item key="support">Support</Menu.Item>
							<Menu.Item onClick={() => signOut({ callbackUrl: "/auth/logout" })} key="logout">
								Log Out
							</Menu.Item>
						</Menu.SubMenu>
						{/* </Menu> */}
					</AccountButton>{" "}
				</div>
			</StyledHeader>

			<Content
				style={{
					padding: "0 20px",
					display: "flex",
					width: "100%",
					height: "100%",
					justifyContent: "center",
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

export default MainLayout;