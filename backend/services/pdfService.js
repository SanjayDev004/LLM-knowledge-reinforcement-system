const pdfParse = require("pdf-parse/lib/pdf-parse.js"); 

const extractTextFromPDF = async (buffer) => {
  try {
    const data = await pdfParse(buffer);

    console.log(" PDF pages:", data.numpages);
    console.log(" PDF text length:", data.text?.length);

    const text = data.text.replace(/\s+/g, " ").trim();

    if (!text || text.length < 50) {
      throw new Error(
        "PDF appears to be empty or image-based — please upload a text-based PDF"
      );
    }

    return text;
  } catch (error) {
    console.error(" PDF Parse Error:", error.message);
    if (error.message.includes("PDF appears to be")) throw error;
    throw new Error("Failed to extract text from PDF: " + error.message);
  }
};

module.exports = { extractTextFromPDF };
