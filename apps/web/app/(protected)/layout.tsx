import Auth from "@/components/monad/Auth";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return <Auth>{children}</Auth>;
};

export default AuthLayout;
