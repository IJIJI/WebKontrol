import { type JSX } from "react/jsx-runtime";
import { Button, ButtonType } from "../components/button/Button";
import { SubmitEventHandler, useRef } from "react";

export default function NewViewPage(): JSX.Element {

  const formRef = useRef<HTMLFormElement>(null);

  const handleForm = async (event: any): Promise<void> => {
    event.preventDefault();

    const datadiv = document.getElementById('datad');
    if (datadiv) 
      datadiv.innerHTML = JSON.stringify(event, null, 2);
    console.log(JSON.stringify(event, null, 2));
  }

  return (
    <>
      <h1>New View</h1>
      <form onSubmit={handleForm} ref={formRef}>
        <div className="formRow">
          <input type="text" name="name" id="viewName" />
          <select name="type" id="viewType">
            <option value="" disabled selected>-</option>
            <option value="website">website</option>
          </select>
          <input type="url" name="website" id="viewUrl" />
          <Button onClick={() => formRef.current?.requestSubmit()} type={ButtonType.ACCENT}>Create</Button>
        </div>
      </form>
      <div id="datad"></div>
    </>
  );
}
