import TrainerHeader from "@/components/TrainerHeader";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <TrainerHeader />
      <main>{children}</main>
    </>
  );
}
