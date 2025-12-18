# backend/api/pdf_export.py
import os
import base64
import tempfile
from flask import Flask, request, send_file, jsonify, abort
from jinja2 import Environment, FileSystemLoader, select_autoescape
from weasyprint import HTML, CSS

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # backend/
TEMPLATES_DIR = os.path.join(ROOT, "tools")  # contains report_template.html
EXPORT_DIR = os.path.join(ROOT, "exports")
os.makedirs(EXPORT_DIR, exist_ok=True)

env = Environment(
    loader=FileSystemLoader(TEMPLATES_DIR),
    autoescape=select_autoescape(["html", "xml"])
)

app = Flask(__name__)

def save_base64_image(b64string: str, dst_path: str):
    """Save a base64-encoded PNG/JPEG (data URI or raw base64) to disk."""
    if b64string.startswith("data:"):
        header, b64 = b64string.split(",", 1)
    else:
        b64 = b64string
    with open(dst_path, "wb") as fh:
        fh.write(base64.b64decode(b64))

@app.route("/api/projects/<project_id>/export/pdf", methods=["POST"])
def export_pdf(project_id):
    """
    Expected JSON body:
    {
      "project": { ... full project payload ... },        # optional if server has saved project
      "results": { "max_deflection_mm": 12.34, ... },     # numeric results to populate
      "images": { "deflection_plot_png": "<base64>", "contour_screenshot_png": "<base64>" },
      "report_title": "Demo Results"
    }
    """
    body = request.get_json(silent=True)
    if not body:
        return abort(400, "Request must be JSON")

    project = body.get("project", {})
    results = body.get("results", {})
    images = body.get("images", {})
    report_title = body.get("report_title", project.get("project_name", "Project Report"))

    # Load Jinja template
    template = env.get_template("report_template.html")

    # Save images to temporary files and create local URIs for the template
    image_map = {}
    tmp_files = []
    for key, b64 in images.items():
        if not b64:
            continue
        fd, path = tempfile.mkstemp(suffix=".png", prefix=f"{project_id}_{key}_", dir=EXPORT_DIR)
        os.close(fd)
        save_base64_image(b64, path)
        image_map[key] = path
        tmp_files.append(path)

    # context for template placeholders
    context = {
        "project": project,
        "results": results,
        "report_title": report_title,
        "materials": project.get("materials", []),
        "summary_notes": results.get("summary_notes", ""),
        # map images in the template to filesystem paths (Jinja will use them as <img src="{{deflection_plot_png}}">)
        "deflection_plot_png": image_map.get("deflection_plot_png", ""),
        "contour_screenshot_png": image_map.get("contour_screenshot_png", "")
    }

    rendered_html = template.render(context)

    # Path for output PDF
    out_pdf_path = os.path.join(EXPORT_DIR, f"{project_id}_report.pdf")
    # Optional CSS: you may include a stylesheet file in tools/ and load here
    css_path = None
    if os.path.exists(os.path.join(TEMPLATES_DIR, "report_styles.css")):
        css_path = os.path.join(TEMPLATES_DIR, "report_styles.css")

    try:
        if css_path:
            HTML(string=rendered_html, base_url=TEMPLATES_DIR).write_pdf(out_pdf_path, stylesheets=[CSS(filename=css_path)])
        else:
            HTML(string=rendered_html, base_url=TEMPLATES_DIR).write_pdf(out_pdf_path)
    except Exception as e:
        # cleanup tmp images
        for p in tmp_files:
            try: os.remove(p)
            except: pass
        return abort(500, f"PDF generation failed: {e}")

    # cleanup tmp images after PDF created (optional)
    for p in tmp_files:
        try: os.remove(p)
        except: pass

    # return file
    return send_file(out_pdf_path, as_attachment=True, download_name=f"{project_id}_report.pdf", mimetype="application/pdf")


if __name__ == "__main__":
    # quick dev server
    app.run(host="0.0.0.0", port=5001, debug=True)
