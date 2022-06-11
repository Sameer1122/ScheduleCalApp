import { GetServerSidePropsContext } from "next";
import { getCsrfToken, signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

import { ErrorCode, getSession } from "@lib/auth";
import { WEBAPP_URL, WEBSITE_URL } from "@lib/config/constants";
import { useLocale } from "@lib/hooks/useLocale";
import { hostedCal, isSAMLLoginEnabled, samlProductID, samlTenantID } from "@lib/saml";
import { collectPageParameters, telemetryEventTypes, useTelemetry } from "@lib/telemetry";
import { inferSSRProps } from "@lib/types/inferSSRProps";

// import AddToHomescreen from "@components/AddToHomescreen";
// import SAMLLogin from "@components/auth/SAMLLogin";
// import TwoFactor from "@components/auth/TwoFactor";
// import AuthContainer from "@components/ui/AuthContainer";

import { IS_GOOGLE_LOGIN_ENABLED } from "@server/lib/constants";
import { ssrInit } from "@server/lib/ssr";

import {
  Layout,
  Image,
  Form,
  Input,
  Button,
  Checkbox,
  message,
  Typography,
  Space,
} from "antd";
import logo from "../../public/custom/logocountry.svg";

import { useFormik } from "formik";
import * as Yup from "yup";
import styled from "styled-components";

const { Header, Content, Footer } = Layout;
const { Text } = Typography;

// interface LoginValues {
//   email: string;
//   password: string;
//   totpCode: string;
//   csrfToken: string;
// }

export default function Login({
  csrfToken,
  isGoogleLoginEnabled,
  isSAMLLoginEnabled,
  hostedCal,
  samlTenantID,
  samlProductID,
}: inferSSRProps<typeof getServerSideProps>) {
  const { t } = useLocale();
  const router = useRouter();
  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
      totpCode: "",
      csrfToken: ""
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email("Invalid email address")
        .required("Email is required"),
      password: Yup.string().required("Password is required"),
    }),
    onSubmit: (values) => {
      message.success("you are logged in successfully");
      // window.localStorage.setItem("token", "123");
    },
  });

  // const form = useForm<LoginValues>();

  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const errorMessages: { [key: string]: string } = {
    // [ErrorCode.SecondFactorRequired]: t("2fa_enabled_instructions"),
    [ErrorCode.IncorrectPassword]: `${t("incorrect_password")} ${t("please_try_again")}`,
    [ErrorCode.UserNotFound]: t("no_account_exists"),
    [ErrorCode.IncorrectTwoFactorCode]: `${t("incorrect_2fa_code")} ${t("please_try_again")}`,
    [ErrorCode.InternalServerError]: `${t("something_went_wrong")} ${t("please_try_again_and_contact_us")}`,
    [ErrorCode.ThirdPartyIdentityProviderEnabled]: t("account_created_with_identity_provider"),
  };

  const telemetry = useTelemetry();

  let callbackUrl = typeof router.query?.callbackUrl === "string" ? router.query.callbackUrl : "";

  // If not absolute URL, make it absolute
  if (/"\//.test(callbackUrl)) callbackUrl = callbackUrl.substring(1);
  if (!/^https?:\/\//.test(callbackUrl)) {
    callbackUrl = `${WEBAPP_URL}/${callbackUrl}`;
  }

  // const LoginFooter = (
  //   <span>
  //     {t("dont_have_an_account")}{" "}
  //     <a href={`${WEBSITE_URL}/signup`} className="font-medium text-neutral-900">
  //       {t("create_an_account")}
  //     </a>
  //   </span>
  // );

  // const TwoFactorFooter = (
  //   <Button
  //     onClick={() => {
  //       setTwoFactorRequired(false);
  //       form.setValue("totpCode", "");
  //     }}
  //     StartIcon={ArrowLeftIcon}
  //     color="minimal">
  //     {t("go_back")}
  //   </Button>
  // );

  return (
    <>
      <Layout style={{ minHeight: "100vh" }}>
        <StyledHeader>
          <Image src={`${process.env.NEXT_PUBLIC_WEBSITE_URL}/custom/logocountry.svg`} />
          <HelpButton>
            <HelpText>Need Help? </HelpText>
          </HelpButton>
        </StyledHeader>
        <Content
          style={{
            padding: "0 50px",
            display: "flex",
            width: "100%",
            height: "100%",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Space
            direction="vertical"
            align="center"
            style={{ width: "100%" }}
          >
            <StyledCard>
              <LoginText> Login </LoginText>
              <SmallText> Enter your login details below</SmallText>
              <Form
                name=""
                className="login-form"
                layout={"vertical"}
                hideRequiredMark
                initialValues={{
                  remember: true,
                }}
                autoComplete="off"
                onFinish={formik.handleSubmit}
              >
                <input defaultValue={csrfToken || undefined} type="hidden" hidden name="csrfToken" />
                <Form.Item
                  label="E-mail"
                  name="email"
                  rules={[
                    {
                      required: true,
                      message: "Please input your Email!",
                    },
                  ]}
                >
                  <Input
                    // prefix={<UserOutlined className="site-form-item-icon" />}
                    placeholder="Email"
                    onChange={formik.handleChange}
                    value={formik.values.email}
                  />
                </Form.Item>
                <Form.Item
                  name="password"
                  label="Password"
                  rules={[
                    {
                      required: true,
                      message: "Please input your Password!",
                    },
                  ]}
                >
                  <Input
                    // prefix={<LockOutlined className="site-form-item-icon" />}
                    type="password"
                    placeholder="Password"
                    onChange={formik.handleChange}
                    value={formik.values.password}
                  />
                </Form.Item>
                <Form.Item
                  name="remember"
                  valuePropName="checked"
                // style={{ color: "#005c3e" }}
                >
                  <Checkbox>Remember me</Checkbox>
                </Form.Item>
                <Form.Item>
                  <StyledButton
                    onClick={() => {
                      signIn<"credentials">("credentials", { ...formik.values, callbackUrl, redirect: false })
                        .then((res) => {
                          if (!res) setErrorMessage(errorMessages[ErrorCode.InternalServerError]);
                          // we're logged in! let's do a hard refresh to the desired url
                          else if (!res.error) router.push(callbackUrl);
                          // reveal two factor input if required
                          else if (res.error === ErrorCode.SecondFactorRequired) setTwoFactorRequired(true);
                          // fallback if error not found
                          else setErrorMessage(errorMessages[res.error] || t("something_went_wrong"));
                        })
                        .catch(() => setErrorMessage(errorMessages[ErrorCode.InternalServerError]));
                    }}
                    type="primary"
                    htmlType="submit"
                    style={{ width: "100%", color: "#005c3e" }}
                  >
                    <ButtonText>Log in</ButtonText>
                  </StyledButton>
                </Form.Item>
              </Form>
            </StyledCard>
            <TroubleContainer>
              Trouble logging in?<Button type="link">Contact Support</Button>
            </TroubleContainer>
          </Space>
        </Content>
        <Footer style={{ textAlign: "center" }}>
          Powered by The Hypo Group
        </Footer>
      </Layout>
    </>
  );
}

const HelpText = styled(Text)`
  font-style: normal;
  font-weight: 500;
  font-size: 16px;
  line-height: 24px;

  color: #005c3e;

  flex: none;
  order: 0;
  flex-grow: 0;
  margin: 0px 8px;
`;

const HelpButton = styled(Button)`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 10px 18px;
  position: static;

  background: #ffffff;
  border: 1px solid #005c3e;
  box-sizing: border-box;
  box-shadow: 0px 1px 2px rgba(16, 24, 40, 0.05);
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
  /* Shadow/sm */
  position: static;
  /* width: 1440px; */
  height: 92px;
  /* left: 0px; */
  /* top: 0px; */

  box-shadow: 0px 1px 3px rgba(16, 24, 40, 0.1),
    0px 1px 2px rgba(16, 24, 40, 0.06);

  /* /* display: flex; */
  justify-content: space-between;
  align-items: center;
`;

const TroubleContainer = styled.div`
  flex-direction: row;
  align-items: flex-start;
  padding: 10px;
  margin-top: 20px;
  position: static;
  /* width: 251px; */
  /* height: 60px; */
  left: 129.5px;
  top: 486px;

  background: rgba(255, 255, 255, 0.5);
  border-radius: 4px;
`;
const ButtonText = styled(Text)`
  font-weight: 400;
  font-size: 16px;
  line-height: 24px;
  /* identical to box height, or 150% */

  /* White Color */

  color: #ffffff;
`;
const StyledButton = styled(Button)`
  /* Secondary Color */
  width: 100%;
  border: 1px solid #007a3e;
  box-sizing: border-box;
  /* Shadow/xs */

  box-shadow: 0px 1px 2px rgba(16, 24, 40, 0.05);
  border-radius: 8px;
`;

const SmallText = styled(Text)`
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  margin-bottom: 16px;
  /* identical to box height, or 143% */

  text-align: center;

  /* Light Text */

  color: #736b63;
`;

const LoginText = styled(Text)`
  font-style: normal;
  font-weight: 700;
  font-size: 20px;
  line-height: 30px;

  /* identical to box height, or 150% */

  text-align: center;

  /* Primary Color */

  color: #005c3e;
`;

const StyledCard = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;

  /* align-items: center; */
  padding: 50px;
  align-self: center;
  justify-self: center;
  /* margin: auto; */
  /* position: static; */
  width: 30vw;
  height: 60vh;

  /* White Color */

  background: #ffffff;
  /* Shadow/md */

  box-shadow: 0px 4px 8px -2px rgba(16, 24, 40, 0.1),
    0px 2px 4px -2px rgba(16, 24, 40, 0.06);

  /* Inside auto layout */

  /* flex: none;
  order: 0;
  flex-grow: 0;
  margin: 24px 0px; */
`;

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { req } = context;
  const session = await getSession({ req });
  const ssr = await ssrInit(context);

  if (session) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return {
    props: {
      csrfToken: await getCsrfToken(context),
      trpcState: ssr.dehydrate(),
      isGoogleLoginEnabled: IS_GOOGLE_LOGIN_ENABLED,
      isSAMLLoginEnabled,
      hostedCal,
      samlTenantID,
      samlProductID,
    },
  };
}
