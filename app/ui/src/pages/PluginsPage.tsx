import { useEffect } from "react";
import ContentSection from "../components/layout/content/ContentSection";
import { usePageContext } from "../context/PageContext";


export default function PluginsPage() {

  const { title, setTitle } = usePageContext();

  useEffect(() => {
    setTitle("Plugins?");
  }, []);

  return (
    <ContentSection>
      <h1>Plugins! - {title}</h1>
    </ContentSection>
  );
}