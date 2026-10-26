import RequestsListPage from "@/components/RequestsListPage";

export default function RequestsPage() {
  return (
    <RequestsListPage
      mine
      title="Minhas solicitações"
      description="Consulte e acompanhe suas solicitações de compra."
      emptyMessage="Nenhuma solicitação cadastrada."
      showCreate
    />
  );
}
