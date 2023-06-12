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

    const fieldIterator = await doc.getFieldIteratorBegin();
    for (; await fieldIterator.hasNext(); fieldIterator.next()) {
      const field = await fieldIterator.current();
      const isValid = await field.isValid();
      const isSignatureField =
        (await field.getType()) === PDFNet.Field.Type.e_signature;
      if (!isValid || !isSignatureField) {
        continue;
      }
      // Create a digital signature field from found signature field
      approval_signature_field =
        await PDFNet.DigitalSignatureField.createFromField(field);
      // const name = await approval_signature_field.getSignatureName();
      // console.log(name);
      // const buffer = await doc.saveMemoryBuffer(0)
      // doc = await PDFNet.PDFDoc.createFromBuffer(buffer)
      // await doc.save("pdf4.pdf", PDFNet.SDFDoc.SaveOptions.e_incremental);
    }

    await approval_signature_field
        .signOnNextSave("./public/files/pdftron.pfx", "password")
        .catch((err) => console.error(err));

    // The actual approval signing will be done during the following incremental save operation.
    await doc.save("pdffinal.pdf", PDFNet.SDFDoc.SaveOptions.e_incremental);
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