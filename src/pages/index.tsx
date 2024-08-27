import { title, subtitle } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";
import FileUploader from "@/components/FileUploader";

export default function IndexPage() {
  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <div className="inline-block max-w-lg text-center justify-center">
          <h1 className={title()}>Sube&nbsp;</h1>
          <h1 className={title({ color: "blue" })}>archivos&nbsp;</h1>
          <br />
          <h1 className={title()}>facilmente.</h1>
        </div>
        <br />
        <FileUploader />
      </section>
    </DefaultLayout>
  );
}
