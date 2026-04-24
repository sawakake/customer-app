import TrainerHeader from "@/components/TrainerHeader";

export default function CustomersLayout({
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
