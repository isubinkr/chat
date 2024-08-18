import { Helmet } from "react-helmet-async";

const Title = (
  title = "Chat",
  description = "This is the chat app called Chat"
) => {
  return (
    <Helmet>
      <title>{`${title}`}</title>
      <meta name="description" content={description} />
    </Helmet>
  );
};

export default Title;
