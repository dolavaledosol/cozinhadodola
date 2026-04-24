import EnviarFotoRelatorio from "@/components/admin/EnviarFotoRelatorio";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

const Divulgacao = () => {
  return (
    <div className="space-y-4">
      <AdminPageHeader title="Divulgação" />
      <EnviarFotoRelatorio inline />
    </div>
  );
};

export default Divulgacao;
