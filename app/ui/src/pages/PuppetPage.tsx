import { useParams } from "react-router-dom";
import { useApi } from "../context/ApiStateContext";
import { usePageContext } from "../context/PageContext";
import { type JSX, useEffect } from "react";

export default function PuppetPage(): JSX.Element {
  const { puppetKey } = useParams();
  const { state } = useApi();
  const { setMeta } = usePageContext();
  const puppet = puppetKey ? state?.puppets.get(puppetKey) : undefined;

  useEffect(() => {
    // if (puppet) setMeta({ title: ["Puppet", puppet.displayName] }, true);
    setMeta({ title: ["Puppets", puppetKey ?? "Unkown"] }, true);
  }, [puppetKey, setMeta]);

  return <h1>Puppet specific page!</h1>;
}
