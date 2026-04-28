import { ReactNode } from "react";
import PageHeader from "@/components/shared/PageHeader";

interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  tabs?: ReactNode;
}

/**
 * Wrapper de compatibilidade — todas as telas admin usam este componente.
 * Internamente usa o PageHeader unificado em modo sticky.
 */
const AdminPageHeader = (props: AdminPageHeaderProps) => {
  return <PageHeader {...props} sticky />;
};

export default AdminPageHeader;
