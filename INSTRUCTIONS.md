# How to Embed the Credit Report Form in Webflow

To avoid conflicts and ensure the form works correctly without affecting the rest of your page, follow these instructions to embed the form using the split files.

### 1. Embed the HTML and CSS

1.  In the Webflow Designer, open the page where you want to add the form.
2.  Add an **Embed** element from the Add panel (`+`) to the desired location on your page.
3.  Open the file `dist/@wf-htmlcss.html` in a text editor.
4.  Copy the entire contents of the file.
5.  Paste the copied code into the Webflow Embed element's code editor.
6.  Save and close the embed editor.

### 2. Add the JavaScript

1.  In the Webflow Designer, go to the **Pages** panel.
2.  Hover over the page you are editing and click the **Settings** (gear) icon.
3.  Scroll down to the **Custom Code** section.
4.  Open the file `dist/@wf-scripts.html` in a text editor.
5.  Copy the entire contents of the file.
6.  Paste the copied code into the **Before `</body>` tag** text area.
7.  Save the page settings.

### 3. Publish Your Site

Publish your Webflow site to see the changes live. The form should now appear and function correctly without interfering with your other page content.
