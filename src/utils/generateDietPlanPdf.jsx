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
  let y = 20;

  const bmi = client.weight && client.height
    ? (client.weight / Math.pow(client.height / 100, 2)).toFixed(1)
    : "-";

  // --- Cover Page ---
  pdf.setFontSize(22);
  pdf.setFont("helvetica", "bold");
  pdf.text("TRUE IRON FITNESS", pageWidth / 2, y, { align: "center" });
  y += 12;

  pdf.setFontSize(14);
  pdf.setFont("helvetica", "normal");
  pdf.text(`Diet Plan Duration: ${duration}`, pageWidth / 2, y, { align: "center" });
  y += 8;
  pdf.text(`Transformation: ${transformationName}`, pageWidth / 2, y, { align: "center" });
  y += 10;

  const image = new Image();
  image.src = `${window.location.origin}/poster.jpg`;

  image.onload = () => {
    const imgWidth = 160;
    const imgHeight = (image.height / image.width) * imgWidth;
    const x = (pageWidth - imgWidth) / 2;
    pdf.addImage(image, "JPEG", x, y, imgWidth, imgHeight);
    y += imgHeight + 10;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(15);
    [
      `Client Name: ${client.name}`,
      `Age: ${client.age || "-"}  Height: ${client.height || "-"} cm  Weight: ${client.weight || "-"} kg`,
      `BMI: ${bmi}`,
    ].forEach(line => {
      pdf.text(line, pageWidth / 2, y, { align: "center" });
      y += 10;
    });

    // --- Food Plan ---
    pdf.addPage();
    let y2 = 20;
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text("Daily Food Chart", 20, y2);
    y2 += 10;

    // ⬇️ Compute total macros
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
    pdf.text(`Total Calories: ${totalCalories.toFixed(0)} kcal`, 20, y2);
    y2 += 6;
    pdf.text(
      `Protein: ${totalProtein.toFixed(1)}g | Carbs: ${totalCarbs.toFixed(1)}g | Fat: ${totalFat.toFixed(1)}g`,
      20,
      y2
    );
    y2 += 10;


    Object.entries(food).forEach(([meal, items]) => {
      if (items.length === 0) return;
      autoTable(pdf, {
        startY: y2,
        head: [[meal, "Food Item", "Grams", "Calories"]],
        body: items.map(f => [
          meal,
          f.name,
          `${f.grams}g`,
          `${(f.calories * (f.grams / 100)).toFixed(0)} kcal`
        ]),
        styles: { fontSize: 11 }
      });
      y2 = pdf.lastAutoTable.finalY + 10;
    });


    // --- Workout Plan ---
    pdf.addPage();
    let y3 = 20;
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text("Workout Plan (Day-wise)", 20, y3);
    y3 += 10;

    Object.entries(workoutPerDay || {}).forEach(([day, list]) => {
      if (!Array.isArray(list) || list.length === 0) return;

      if (y3 > 250) {
        pdf.addPage();
        y3 = 20;
      }

      pdf.setFontSize(13);
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
        styles: { fontSize: 11 }
      });

      y3 = pdf.lastAutoTable.finalY + 10;
    });

    // --- Essentials ---
    pdf.addPage();
    let y4 = 20;
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text("Daily Essentials", 20, y4);
    y4 += 10;

    const essentialsData = Object.entries(essentials || {}).flatMap(([meal, items]) =>
      (items || []).map(item => [meal, item])
    );

    if (essentialsData.length > 0) {
      autoTable(pdf, {
        startY: y4,
        head: [["Meal", "Essential Item"]],
        body: essentialsData,
        styles: { fontSize: 11 }
      });
    }

    // --- Guidelines ---
    pdf.addPage();
    let y5 = 20;
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("Important Guidelines", 20, y5);
    y5 += 10;

    const guidelines = [
      "1. Get at least 8 hours of quality sleep every day.",
      "2. Consume 120g of protein per day.",
      "3. Focus on lifting heavier weights progressively.",
      "4. Prioritize muscle hypertrophy by breaking down muscle fibers.",
      "5. Stick to the macro ratio: Protein : Carbs : Fats = 3 : 2 : 2.",
      "6. Weigh yourself once every 3 days and update your coach.",
      "7. Do 40 minutes of brisk walking daily (mandatory).",
      "8. Cheat meal is allowed once every 10 days. It's a meal, not a day.",
      "9. Remind me on 17.08.19 for your updated diet plan.",
      "10. Stay hydrated, stay consistent, and trust the process!",
      "11. This plan is customized. Do not share it with others."
    ];

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(12);
    guidelines.forEach(line => {
      if (y5 > 280) {
        pdf.addPage();
        y5 = 20;
      }
      pdf.text(line, 20, y5);
      y5 += 8;
    });

    pdf.save(`${client.name}_Plan_Full.pdf`);
  };

  image.onerror = () => {
    alert("Could not load poster.jpg from public folder.");
  };
}
