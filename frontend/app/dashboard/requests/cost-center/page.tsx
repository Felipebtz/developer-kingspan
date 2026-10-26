import RequestsListPage from "@/components/RequestsListPage";

export default function CostCenterRequestsPage() {
  return (
    <RequestsListPage
      mine={false}
      title="Solicitações do centro de custo"
      description="Consulte as solicitações visíveis do seu centro de custo."
      emptyMessage="Nenhuma solicitação visível neste centro de custo."
    />
  );
}
