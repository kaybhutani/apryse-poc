const { PDFNet } = require("@pdftron/pdfnet-node");
module.exports = async function signDocument(buffer) {
  const main = async (buffer) => {
    // await PDFNet.initialize(
    //   (licenseKey =
    //     "demo:1683529385074:7dd7f414030000000091fc074e0a6e3385a7f45f53af02bd0ff4db06d9")
    // );
    let doc = await PDFNet.PDFDoc.createFromBuffer(buffer);
    let approval_signature_field;
    // Find signature field in document

    const page = await doc.getPage(1);
    const fieldIterator = await doc.getFieldIteratorBegin();

    const fields = []

    for (; await fieldIterator.hasNext(); fieldIterator.next()) {
      const field = await fieldIterator.current();    
      fields.push(field);
    }

    fieldIterator.destroy();

    for(const field of fields) {
      const isValid = await field.isValid();
      const isSignatureField =
        (await field.getType()) === PDFNet.Field.Type.e_signature;

      if(!isValid) continue;

      if(isSignatureField) {
        approval_signature_field = await PDFNet.DigitalSignatureField.createFromField(field);
      }

      if(!isSignatureField) {
        await field.flatten(page)
      }
    }

    await approval_signature_field
        .signOnNextSave("./public/files/pdftron.pfx", "password")
        .catch((err) => console.error(err));

    // // The actual approval signing will be done during the following incremental save operation.
    await doc.save("pdffinalflatten8.pdf", PDFNet.SDFDoc.SaveOptions.e_incremental);
  };

  await PDFNet.initialize(
      (licenseKey =
        "demo:1683529385074:7dd7f414030000000091fc074e0a6e3385a7f45f53af02bd0ff4db06d9")
    );
  // add your own license key as the second parameter, e.g. in place of 'YOUR_LICENSE_KEY'.
  PDFNet.runWithCleanup(
    () => main(buffer),
    "demo:1683529385074:7dd7f414030000000091fc074e0a6e3385a7f45f53af02bd0ff4db06d9"
  )
    .catch(function (error) {
      console.error(error);
      throw error;
    })
    .then(function () {
      PDFNet.shutdown();
    });
};