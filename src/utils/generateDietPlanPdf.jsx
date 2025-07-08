import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function generateDietPlanPdf(client, food, essentials, workoutPerDay, planDatesFromDB) {
  if (!client || !client.name) {
    alert("Missing client data");
    return;
  }

  const MEAL_ORDER = [
    "Empty Stomach",
    "Early Morning (6:30–7:00 AM)",
    "Breakfast ",
    "Mid Morning (11:00 AM)",
    "Lunch",
    "Afternoon (12:30–1:00 PM)",
    "Evening",
    "Late Evening",
    "Post Workout",
    "Dinner",
    "Night",
    "30 min Before Bed"
  ];


  const transformationName = client.transformationName || "Custom Transformation";
  const startDate = client.planDates?.from || planDatesFromDB?.from || "Not specified";
  const endDate = client.planDates?.to || planDatesFromDB?.to || "Not specified";
  const duration = `${startDate} to ${endDate}`;

  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();

  const bmi = client.weight && client.height
    ? (client.weight / Math.pow(client.height / 100, 2)).toFixed(1)
    : "-";

  const calculateAge = (dobStr) => {
    const dob = new Date(dobStr);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age;
  };
  const age = client.dob ? calculateAge(client.dob) : "-";

  const poster = new Image();
  poster.src = `${window.location.origin}/poster.jpg`;

  poster.onload = () => {
    // --- Cover Page ---
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

    // --- FOOD SECTION ---
    pdf.addPage();
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(200, 0, 0);
    pdf.text("Daily Food Chart", 20, 20);

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
    pdf.text(`Total Calories: ${totalCalories.toFixed(0)} kcal`, 20, 30);
    pdf.text(
      `Protein: ${totalProtein.toFixed(1)}g | Carbs: ${totalCarbs.toFixed(1)}g | Fat: ${totalFat.toFixed(1)}g`,
      20,
      38
    );

    let currentY = 48;
    const mealKeys = MEAL_ORDER.filter(meal => (food[meal]?.length > 0 || essentials[meal]?.length > 0));


    mealKeys.forEach((meal) => {
      const items = food[meal] || [];
      const mealEssentials = essentials[meal] || [];

      if (items.length > 0) {
        autoTable(pdf, {
          startY: currentY,
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
        currentY = pdf.lastAutoTable.finalY + 6;
      }

      if (mealEssentials.length > 0) {
        if (currentY > 270) {
          pdf.addPage();
          currentY = 20;
        }
        pdf.setFont("helvetica", "italic");
        pdf.setFontSize(11);
        const essentialsText = `Essentials: ${mealEssentials
          .map(item =>
            typeof item === "object" && item.name
              ? `${item.name}${item.dosage ? ` (${item.dosage})` : ""}`
              : item
          )
          .join(", ")}`;

        const wrappedText = pdf.splitTextToSize(essentialsText, pageWidth - 40); // 40 = padding (20 on each side)
        pdf.text(wrappedText, 20, currentY);
        currentY += wrappedText.length * 6; // Adjust based on line height (6 is a safe estimate)

        currentY += 10;
      }
    });

    // --- WORKOUT SECTION ---
    pdf.addPage();
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
        body: list.map(w => {
          const breakdown = w.setBreakdown;
          const hasBreakdown =
            breakdown &&
            ["warmup", "working", "failure", "drop"].some(type => breakdown[type]?.sets > 0);

          if (hasBreakdown) {
            const repsInfo = ["warmup", "working", "failure", "drop"]
              .filter(type => breakdown[type]?.sets > 0)
              .map(type => `${type}: ${breakdown[type].sets}x${breakdown[type].reps}`)
              .join(", ");
            return [w.name, w.equipment || "None", "-", repsInfo];
          } else {
            return [w.name, w.equipment || "None", w.sets || 3, w.reps || 10];
          }
        }),
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
    let y5 = 20;
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(200, 0, 0);
    pdf.text("Important Guidelines", 20, y5);
    y5 += 10;

    const guidelines = [
      " * Health conditions and allergies must be informed (e.g., BP, diabetes).",
      " * Use only the recommended dosage.",
      " * Inform if you have seizures/fits or take regular medication.",
      "1. Sleep at least 8 hours daily.",
      "2. Eat suggested protein amount.",
      "3. Lift progressively heavier weights.",
      "4. Prioritize hypertrophy training.",
      "5. Macro ratio: Protein:Carbs:Fats = 3:2:2.",
      "6. Weigh yourself every 3 days and update coach.",
      "7. Do 40 mins brisk walking daily.",
      "8. Cheat *meal* allowed once every 10 days.",
      "9. Remind coach every SATURDAY for updates.",
      "10. Stay hydrated, be consistent!",
      "11. This plan is personalized—do not share."
    ];

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
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

  poster.onerror = () => alert("Could not load poster.jpg from public folder.");
}
