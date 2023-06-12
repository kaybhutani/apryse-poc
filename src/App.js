import React, { useRef, useEffect, useState } from "react";
import WebViewer from "@pdftron/webviewer";
import "./App.css";

const App = () => {
  const viewer = useRef(null);

  const [instance, setInstance] = useState();
  const [downloadLink, setDownloadLink] = useState();

  const signDocument = async () => {
    const { documentViewer, PDFNet, annotationManager } = instance.Core;

    const xfdfString = await annotationManager.exportAnnotations();
    let viewerDoc = await documentViewer
      .getDocument()
      .getFileData({ xfdfString });

    const pdfDoc = await PDFNet.PDFDoc.createFromBuffer(viewerDoc);

    await PDFNet.initialize();
    await PDFNet.runWithCleanup(
      async () => await completeSignature(PDFNet, pdfDoc, xfdfString)
    );
  };

  const completeSignature = async (PDFNet, doc, xfdfString) => {
    doc.lock();
    doc.initSecurityHandler();

    const digitalSignatureFields = [];

    // Find signature field in document
    const fieldIterator = await doc.getFieldIteratorBegin();
    for (; await fieldIterator.hasNext(); fieldIterator.next()) {
      const field = await fieldIterator.current();
      if (
        !(await field.isValid()) ||
        (await field.getType()) !== PDFNet.Field.Type.e_signature
      ) {
        continue;
      }

      // Create a digital signature field from found signature field
      // TODO: This should be done on BE.
      const digitalSignatureField =
        await PDFNet.DigitalSignatureField.createFromField(field);
      digitalSignatureFields.push(digitalSignatureField);
    }

    // // Prepare the signature and signature handler for signing.
    // await digitalSignatureFields[0].signOnNextSaveFromURL("/files/pdftron.pfx", 'password');

    // Flatten annotations
    instance.UI.downloadPdf({
      xfdfString,
      // flatten: true,
    });
  };

  const createSignatureField = (rect, Annotations, annotationManager) => {
    // create a form field
    const signatureField = new Annotations.Forms.Field("signatureField", {
      type: "Sig",
    });

    // create a widget annotation
    const signatureWidget = new Annotations.SignatureWidgetAnnotation(
      signatureField,
      {
        appearance: "_DEFAULT",
        appearances: {
          _DEFAULT: {
            Normal: {
              offset: {
                x: rect.x1,
                y: rect.y1,
              },
            },
          },
        },
      }
    );

    // set position and size
    signatureWidget.PageNumber = 1;
    signatureWidget.X = rect.x1;
    signatureWidget.Y = rect.y1;
    signatureWidget.Width = rect.getWidth();
    signatureWidget.Height = rect.getHeight();

    //add the form field and widget annotation
    annotationManager.getFieldManager().addField(signatureField);
    annotationManager.addAnnotation([signatureWidget]);
    annotationManager.redrawAnnotation(signatureWidget);
  };

  const createTextField = (rect, Annotations, annotationManager) => {
    // create a form field
    const textField = new Annotations.Forms.Field("textField1", {
      type: "Tx",
      defaultValue: "Enter Text",
    });

    // create a widget annotation
    const widgetAnnot = new Annotations.TextWidgetAnnotation(textField);

    // set position and size
    widgetAnnot.PageNumber = 1;
    widgetAnnot.X = rect.x1;
    widgetAnnot.Y = rect.y1;
    widgetAnnot.Width = 50;
    widgetAnnot.Height = 20;
    widgetAnnot.color = new Annotations.Color(0, 0, 0, 1);
    widgetAnnot.Id = "textAnnot";

    //add the form field and widget annotation
    annotationManager.getFieldManager().addField(textField);
    annotationManager.addAnnotation(widgetAnnot);
    annotationManager.redrawAnnotation(widgetAnnot);
  };

  const createCheckboxField = (rect, Annotations, annotationManager) => {
    const font = new Annotations.Font({ name: "Helvetica" });

    // create a form field
    const checkboxField = new Annotations.Forms.Field("checkbox1", {
      type: "Btn",
      value: "Off",
      font,
    });

    const widgetAnnot = new Annotations.CheckButtonWidgetAnnotation(
      checkboxField,
      {
        appearance: "Off",
        appearances: {
          Off: {},
          Yes: {},
        },
        captions: {
          Normal: "", // Check
        },
      }
    );

    // set position and size
    widgetAnnot.PageNumber = 1;
    widgetAnnot.X = rect.x1;
    widgetAnnot.Y = rect.y1;
    widgetAnnot.Width = 10;
    widgetAnnot.Height = 10;
    widgetAnnot.Id = "checkboxAnnot";

    //add the form field and widget annotation
    annotationManager.getFieldManager().addField(checkboxField);
    annotationManager.addAnnotation(widgetAnnot);
    annotationManager.redrawAnnotation(widgetAnnot);
  };

  const createDateField = (rect, Annotations, annotationManager) => {
    // create a form field
    const dateField = new Annotations.Forms.Field("date1", {
      type: "Tx",
      defaultValue: "2021/09/01",
    });

    // create a date picker widget annotation
    const widgetAnnot = new Annotations.DatePickerWidgetAnnotation(dateField);

    // set position and size
    widgetAnnot.PageNumber = 1;
    widgetAnnot.X = rect.x1;
    widgetAnnot.Y = rect.y1;
    widgetAnnot.Width = 150;
    widgetAnnot.Height = 30;
    widgetAnnot.Id = "dateAnnot";

    annotationManager.getFieldManager().addField(dateField);
    annotationManager.addAnnotation(widgetAnnot);
    annotationManager.redrawAnnotation(widgetAnnot);
  };

  // if using a class, equivalent of componentDidMount
  useEffect(() => {
    WebViewer(
      {
        fullAPI: true,
        path: "/webviewer/",
        disabledElements: [
          "ribbons",
          "toggleNotesButton",
          "searchButton",
          "menuButton",
          "rubberStampToolGroupButton",
          "stampToolGroupButton",
          "fileAttachmentToolGroupButton",
          "calloutToolGroupButton",
          "undo",
          "redo",
          "eraserToolButton",
        ],
        initialDoc: "/files/demo2.pdf",
      },
      viewer.current
    ).then((instance) => {
      setInstance(instance);
      const {
        documentViewer,
        annotationManager,
        Annotations,
        Search,
        Math,
        PDFNet,
      } = instance.Core;

      Annotations.WidgetAnnotation.getContainerCustomStyles = (widget) => {
        if (widget instanceof Annotations.TextWidgetAnnotation) {
          // can check widget properties
          if (widget.fieldName === "f1-1") {
            return {
              "background-color": "lightgreen",
            };
          }
          return {
            "background-color": "lightblue",
            color: "brown",
          };
        } else if (widget instanceof Annotations.PushButtonWidgetAnnotation) {
          return {
            "background-color": "black",
            color: "white",
          };
        } else if (widget instanceof Annotations.CheckButtonWidgetAnnotation) {
          return {
            "background-color": "lightgray",
            opacity: 0.8,
          };
        }
      };

      Annotations.WidgetAnnotation.getCustomStyles = (widget) => {
        if (widget instanceof Annotations.TextWidgetAnnotation) {
          // can check widget properties
          if (widget.fieldName === "f1-1") {
            return {
              "background-color": "lightgreen",
            };
          }
          return {
            "background-color": "lightblue",
            color: "brown",
          };
        } else if (widget instanceof Annotations.PushButtonWidgetAnnotation) {
          return {
            "background-color": "black",
            color: "white",
          };
        } else if (widget instanceof Annotations.CheckButtonWidgetAnnotation) {
          return {
            "background-color": "lightgray",
            opacity: 0.8,
          };
        }
      };

      documentViewer.addEventListener("documentLoaded", async () => {
        await PDFNet.initialize();

        // REGEXT to detect the SignRequest placeholders.
        const searchText =
          "\\[\\[(?:\\s*([a-zA-Z])\\s*\\|\\s*([-]?\\d)\\s*)+\\]\\]|\\[\\[(\\w)\\|(([-]?\\d))\\|([^|\\]]+)(?:\\|([^|\\]]+))?\\]\\]";
        // const searchText = '[[s| 0 ]]';
        const mode =
          Search.Mode.PAGE_STOP | Search.Mode.HIGHLIGHT | Search.Mode.REGEX;
        const searchOptions = {
          // If true, a search of the entire document will be performed. Otherwise, a single search will be performed.
          fullSearch: true,
          onError: (error) => {
            console.log("error", error);
          },
          // The callback function that is called when the search returns a result.
          onResult: (result) => {
            if (result.resultCode === Search.ResultCode.FOUND) {
              const textQuad = result.quads[0].getPoints(); // getPoints will return Quad objects
              const quad = new Math.Quad(
                textQuad.x1,
                textQuad.y1,
                textQuad.x2,
                textQuad.y2,
                textQuad.x3,
                textQuad.y3,
                textQuad.x4,
                textQuad.y4
              );

              const rect = quad.toRect();

              const isTextField = result.resultStr.includes("[[t");
              const isCheckbox = result.resultStr.includes("[[c");
              const isDate = result.resultStr.includes("[[d");
              const isSignature = result.resultStr.includes("[[s");

              if (isSignature)
                createSignatureField(rect, Annotations, annotationManager);
              if (isTextField)
                createTextField(rect, Annotations, annotationManager);
              if (isCheckbox)
                createCheckboxField(rect, Annotations, annotationManager);
              if (isDate) createDateField(rect, Annotations, annotationManager);
            }
          },
        };

        documentViewer.textSearchInit(searchText, mode, searchOptions);
      });
    });
  }, []);

  return (
    <div className="App">
      <div className="header">React sample</div>
      <button onClick={signDocument}>Sign document</button>
      {downloadLink && (
        <a href={downloadLink} download="signed_doc.pdf">
          Download PDF
        </a>
      )}
      <div className="webviewer" style={{ height: "100vh" }} ref={viewer}></div>
    </div>
  );
};

export default App;
