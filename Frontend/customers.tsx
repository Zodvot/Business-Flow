import Catalog from './catalog';
export default function Customers({ admin }: { admin: boolean }) {
  return <Catalog kind="customers" admin={admin} />;
}
