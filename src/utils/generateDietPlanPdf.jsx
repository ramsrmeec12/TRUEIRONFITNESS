import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function generateDietPlanPdf(client, food, essentials, workoutPerDay) {
  if (!client || !client.name) {
    alert("Missing client data");
    return;
  }

  const transformationName = prompt("Enter Transformation Name (e.g. 100 Days Challenge):");
  const startDate = prompt("Enter Start Date (YYYY-MM-DD):");
  const endDate = prompt("Enter End Date (YYYY-MM-DD):");
  if (!transformationName || !startDate || !endDate) {
    alert("Please fill in all transformation details");
    return;
  }

  const duration = `${startDate} to ${endDate}`;
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // ✅ Calculate BMI
  const bmi = client.weight && client.height
    ? (client.weight / Math.pow(client.height / 100, 2)).toFixed(1)
    : "-";

  // ✅ Calculate Age from DOB
  const calculateAge = (dobStr) => {
    const dob = new Date(dobStr);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  const age = client.dob ? calculateAge(client.dob) : "-";

  const watermark = new Image();
  watermark.src = `${window.location.origin}/ironlife_black_watermark.png`;

  const poster = new Image();
  poster.src = `${window.location.origin}/poster.jpg`;

  const drawWatermark = (pageNum) => {
    pdf.setPage(pageNum);
    pdf.setGState(new pdf.GState({ opacity: 0.05 }));
    const wmWidth = 100;
    const wmHeight = 100;
    const wmX = (pageWidth - wmWidth) / 2;
    const wmY = (pageHeight - wmHeight) / 2;
    pdf.addImage(watermark, "PNG", wmX, wmY, wmWidth, wmHeight);
    pdf.setGState(new pdf.GState({ opacity: 1 }));
  };

  watermark.onload = () => {
    poster.onload = () => {
      let pageNum = 1;
      drawWatermark(pageNum);

      let y = 20;
      pdf.setFontSize(22);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(200, 0, 0);
      pdf.text("TEAM IRON LIFE", pageWidth / 2, y, { align: "center" });
      y += 12;

      pdf.setFontSize(14);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Diet Plan Duration: ${duration}`, pageWidth / 2, y, { align: "center" });
      y += 8;
      pdf.text(`Transformation: ${transformationName}`, pageWidth / 2, y, { align: "center" });
      y += 10;

      const imgWidth = 160;
      const imgHeight = (poster.height / poster.width) * imgWidth;
      const x = (pageWidth - imgWidth) / 2;
      pdf.addImage(poster, "JPEG", x, y, imgWidth, imgHeight);
      y += imgHeight + 10;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(15);
      [
        `Client Name: ${client.name}`,
        `Age: ${age}  Height: ${client.height || "-"} cm  Weight: ${client.weight || "-"} kg`,
        `BMI: ${bmi}`,
      ].forEach(line => {
        pdf.text(line, pageWidth / 2, y, { align: "center" });
        y += 10;
      });

      // --- Food Plan ---
      pdf.addPage();
      pageNum++;
      drawWatermark(pageNum);

      let y2 = 20;
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(200, 0, 0);
      pdf.text("Daily Food Chart", 20, y2);
      y2 += 10;

      let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0;
      Object.values(food).flat().forEach(item => {
        const grams = item.grams || 100;
        const factor = grams / 100;
        totalCalories += (item.calories || 0) * factor;
        totalProtein += (item.protein || 0) * factor;
        totalCarbs += (item.carbs || 0) * factor;
        totalFat += (item.fat || 0) * factor;
      });

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Total Calories: ${totalCalories.toFixed(0)} kcal`, 20, y2);
      y2 += 6;
      pdf.text(
        `Protein: ${totalProtein.toFixed(1)}g | Carbs: ${totalCarbs.toFixed(1)}g | Fat: ${totalFat.toFixed(1)}g`,
        20,
        y2
      );
      y2 += 10;

      const mealOrder = ["Breakfast", "Lunch", "Dinner"];
      mealOrder.forEach((meal) => {
        const items = food[meal] || [];
        const mealEssentials = essentials[meal] || [];

        if (items.length > 0) {
          autoTable(pdf, {
            startY: y2,
            head: [[meal, "Food Item", "Grams", "Calories"]],
            body: items.map(f => [
              meal,
              f.name,
              `${f.grams}g`,
              `${(f.calories * (f.grams / 100)).toFixed(0)} kcal`
            ]),
            styles: { fontSize: 11 },
            headStyles: {
              fillColor: [200, 0, 0],
              textColor: [255, 255, 255]
            }
          });
          y2 = pdf.lastAutoTable.finalY + 4;
        }

        if (mealEssentials.length > 0) {
          pdf.setFont("helvetica", "italic");
          pdf.setFontSize(11);
          pdf.text(
            `Essentials for ${meal}: ${mealEssentials
              .map(item => typeof item === "object" && item.name ? `${item.name}${item.dosage ? ` (${item.dosage})` : ""}` : item)
              .join(", ")}`,
            20,
            y2
          );

          y2 += 10;
        }
      });

      // --- Workout Plan ---
      pdf.addPage();
      pageNum++;
      drawWatermark(pageNum);

      let y3 = 20;
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(200, 0, 0);
      pdf.text("Workout Plan (Day-wise)", 20, y3);
      y3 += 10;

      const sortedDays = Object.keys(workoutPerDay || {}).sort((a, b) => {
        const n1 = parseInt(a.match(/\d+/)?.[0] || "0");
        const n2 = parseInt(b.match(/\d+/)?.[0] || "0");
        return n1 - n2;
      });

      sortedDays.forEach(day => {
        const list = workoutPerDay[day];
        if (!Array.isArray(list) || list.length === 0) return;

        if (y3 > 250) {
          pdf.addPage();
          pageNum++;
          drawWatermark(pageNum);
          y3 = 20;
        }

        pdf.setFontSize(13);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(0, 0, 0);
        pdf.text(day, 20, y3);
        y3 += 6;

        autoTable(pdf, {
          startY: y3,
          head: [["Workout", "Equipment", "Sets", "Reps"]],
          body: list.map(w => [
            w.name,
            w.equipment || "None",
            w.sets || 3,
            w.reps || 10
          ]),
          styles: { fontSize: 11 },
          headStyles: {
            fillColor: [200, 0, 0],
            textColor: [255, 255, 255]
          }
        });

        y3 = pdf.lastAutoTable.finalY + 10;
      });

      // --- Guidelines ---
      pdf.addPage();
      pageNum++;
      drawWatermark(pageNum);

      let y5 = 20;
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(200, 0, 0);
      pdf.text("Important Guidelines", 20, y5);
      y5 += 10;

      const guidelines = [
        "* Health conditions should be informed prior to the trainer to customise your diet plans",
        "1. Get at least 8 hours of quality sleep every day.",
        "2. Consume suggested amount of protein per day.",
        "3. Focus on lifting heavier weights progressively.",
        "4. Prioritize muscle hypertrophy by breaking down muscle fibers.",
        "5. Stick to the macro ratio: Protein : Carbs : Fats = 3 : 2 : 2.",
        "6. Weigh yourself once every 3 days and update your coach.",
        "7. Do 40 minutes of brisk walking daily (mandatory).",
        "8. Cheat meal is allowed once every 10 days. It's a meal, not a day.",
        "9. Remind me on every SATURDAY for your updated diet plan.",
        "10. Stay hydrated, stay consistent, and trust the process!",
        "11. This plan is customized. Do not share it with others."
      ];

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      guidelines.forEach(line => {
        if (y5 > 280) {
          pdf.addPage();
          pageNum++;
          drawWatermark(pageNum);
          y5 = 20;
        }
        pdf.text(line, 20, y5);
        y5 += 8;
      });

      pdf.save(`${client.name}_Plan_Full.pdf`);
    };

    poster.onerror = () => {
      alert("Could not load poster.jpg from public folder.");
    };
  };

  watermark.onerror = () => {
    alert("Could not load watermark image (ironlife.png).");
  };
}
