import { useParams } from "react-router-dom";
import { useApi } from "../context/ApiStateContext";
import { usePageContext } from "../context/PageContext";
import { type JSX, useEffect, useState } from "react";

export default function PuppetPage(): JSX.Element {
  const { puppetKey } = useParams();
  const { state } = useApi();
  const { setMeta } = usePageContext();

  const [title, setTitle] = useState<string>(puppetKey ?? "Unkown Puppet");
  const puppet = puppetKey ? state?.puppets.get(puppetKey) : undefined;
  
  useEffect(() => {
    setTitle(puppet?.config.name.long ?? puppetKey ?? "Unkown Puppet");
  }, [puppet])

  useEffect(() => {
    // if (puppet) setMeta({ title: ["Puppet", puppet.displayName] }, true);
    setMeta({ title: ["Puppets", title] }, true);
  }, [puppetKey, setMeta, title]);

  return (
    <>
      <h1>{title}</h1>
      <pre>{JSON.stringify(puppet, null, 2)}</pre>
    </>
  );
}
