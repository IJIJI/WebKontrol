import { useParams } from "react-router-dom";
import ContentSection from "../components/layout/content/ContentSection";
import { useApi } from "../context/ApiStateContext";
import { usePageContext } from "../context/PageContext";
import { useEffect } from "react";


export default function PuppetPage() {
  const { puppetKey } = useParams();
  const { state } = useApi();
  const { setMeta } = usePageContext();
  const puppet = puppetKey ? state.puppets.get(puppetKey) : undefined;

  useEffect(() => {
    // if (puppet) setMeta({ title: ["Puppet", puppet.displayName] }, true);
    setMeta({ title: ["Puppets", puppetKey ?? "Unkown"] }, true);
  }, [puppetKey, setMeta]);

  return (
    <ContentSection>
      <h1>Puppet specific page!</h1>
    </ContentSection>
  );
}