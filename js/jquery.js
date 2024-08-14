$(document).ready(function () {
  // Variable to store the task that will be deleted
  let findTask = null;
  let anyModalOpen = null;

  // Variable to store the filter value
  let selectedFilter = "any";

  // Variable to store the switch that open the modal
  let originalSwitch = null;

  // Set the val and min attributes to the current date and time
  let now = new Date();
  let year = now.getFullYear();
  let month = ("0" + (now.getMonth() + 1)).slice(-2);
  let day = ("0" + now.getDate()).slice(-2);
  let hours = "23";
  let minutes = "59";
  let formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;
  $("#deadline").attr("min", formattedDate);
  $("#deadline").val(formattedDate);

  // Load tasks from local storage
  loadTasks();

  // Add task event
  $(".btn-success").on("click", function () {
    const taskText = $("#taskText").val().trim();
    const priority = $("#priority").val();
    const deadline = $("#deadline").val();

    let valid = true;
    const newBorder = "2px solid rgba(255, 54, 54, 0.879)";
    const oldBorder = "2px solid rgba(176, 176, 176, 0.804)";

    // Check if task text is filled
    if (taskText === "") {
      $("#textError").removeClass("d-none");
      $("#taskText").css("border", newBorder);
      valid = false;
    } else {
      $("#textError").addClass("d-none");
      $("#taskText").css("border", oldBorder);
    }

    // Check if priority is selected
    if (priority === "") {
      $("#priorityError").removeClass("d-none");
      $("#priority").css("border", newBorder);
      valid = false;
    } else {
      $("#priorityError").addClass("d-none");
      $("#priority").css("border", oldBorder);
    }

    // If both fields are valid, add the task
    if (valid) {
      const task = {
        text: taskText,
        priority: priority,
        deadline: deadline,
        state: "pending",
      };

      // Add tasks to HTML
      addTask(task);
      // Add tasks to local storage
      saveTask(task);
      // Check if there are any tasks and filter the tasks
      filterTasks();

      $("#taskText").val("");
      $("#priority").val("");
      $("#deadline").val(formattedDate);
    }
  });

  // Edit task event
  $(document).on("click", ".btn-outline-primary", function () {
    const task = $(this).parents(".task");
    const taskText = task.find("p");
    const newText = prompt("Edit your task:", taskText.text().trim());

    if (newText !== null && newText !== taskText.text()) {
      taskText.text(newText);
      updateLocalStorage();
    }
  });

  // Filter tasks event
  $("#taskFilter").on("change", function () {
    selectedFilter = $(this).val();
    filterTasks();
  });

  // Open modal when delete button click
  $(document).on("click", ".btn-danger", function () {
    findTask = $(this).parents(".task");
    anyModalOpen = "delete task";

    $("#deleteModalLabel").text("Confirm Delete");
    $(".modal-body").text("Are you sure you want to delete this task?");
    $("#confirmDelete").text("Delete");
    $("#deleteModal").modal("show");
  });

  // Open modal when delete all button click
  $(document).on("click", ".btn-outline-dark", function () {
    anyModalOpen = "delete all tasks";

    $("#deleteModalLabel").text("Confirm Delete");
    $(".modal-body").text("Are you sure you want to delete all tasks?");
    $("#confirmDelete").text("Delete");
    $("#deleteModal").modal("show");
  });

  // Open modal when switch button is toggled to checked
  $(document).on("change", ".form-check-input", function () {
    if ($(this).is(":checked")) {
      findTask = $(this).parents(".task");
      anyModalOpen = "completed";
      originalSwitch = this;

      $("#deleteModalLabel").text("Confirm Completed");
      $(".modal-body").text(
        "Are you sure you want to mark this task as completed?"
      );
      $("#confirmDelete").text("Completed");
      $("#deleteModal").modal("show");
    }
  });

  // Confirm event in modal
  $("#confirmDelete").on("click", function () {
    if (anyModalOpen === "delete all tasks") {
      // Remove only the tasks that match the selected filter
      $(".task").each(function () {
        const state = $(this).data("state");
        if (selectedFilter === "any" || selectedFilter === state) {
          $(this).remove();
        }
      });
    } else if (anyModalOpen === "delete task") {
      findTask.remove();
    } else if (anyModalOpen === "completed") {
      // Update task state in DOM
      findTask.data("state", "completed");
      findTask.find("span:last").text("completed");

      findTask.find(".form-check-input").attr({
        checked: true,
        disabled: true,
      });
      findTask.find(".form-check-label").text("Completed");
    }

    $("#deleteModal").modal("hide");
    updateLocalStorage();
    filterTasks();
  });

  // Revert switch state if modal is canceled
  $("#deleteModal").on("hidden.bs.modal", function () {
    if (anyModalOpen === "completed" && originalSwitch) {
      $(originalSwitch).prop("checked", false);
      originalSwitch = null;
    }
  });

  // Function to add tasks to html
  function addTask(task) {
    const formattedDeadline = task.deadline.replace("T", " ");

    let switchHtml = "";
    if (task.state === "pending") {
      switchHtml = `
        <div class="form-check form-switch mt-4">
          <input class="form-check-input" type="checkbox" id="switch-${task.text}">
          <label class="form-check-label" for="switch-${task.text}">
            Mark as completed
          </label>
        </div>`;
    } else if (task.state === "completed") {
      switchHtml = `
        <div class="form-check form-switch mt-4">
          <input class="form-check-input" type="checkbox" checked disabled>
          <label class="form-check-label">
            Completed
          </label>
        </div>`;
    } else if (task.state === "not completed") {
      switchHtml = `
        <div class="form-check form-switch mt-4">
          <input class="form-check-input" style="background-color: rgba(255, 0, 0, 0.28)" type="checkbox" disabled>
          <label class="form-check-label text-danger">
            Not completed
          </label>
        </div>`;
    }

    const taskHtml = `
      <div class="task" data-state="${task.state}">
        <div class="row">
          <div class="col-12 col-lg-9 text-center text-lg-start">
            <p class="mb-2">${task.text}</p>
            Priority:
            <span class="me-2 text-danger">${task.priority},</span>
            Deadline:
            <span class="me-2 text-danger">${formattedDeadline},</span>
            State:
            <span class="text-danger">${task.state}</span>
          </div>
          <div class="col d-flex justify-content-center justify-content-lg-end align-items-center mt-lg-0 mt-4">
            <button type="button" class="btn btn-outline-primary me-3">Edit</button>
            <button type="button" class="btn btn-danger">Delete</button>
          </div>
        </div>
        ${switchHtml}
      </div>`;

    $("#tasks").append(taskHtml);
  }

  // Function to load tasks from local storage
  function loadTasks() {
    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

    // Check if each task's deadline has passed
    tasks.forEach((task) => {
      let taskDeadline = new Date(task.deadline);
      if (now > taskDeadline && task.state === "pending") {
        task.state = "not completed";
      }
    });

    localStorage.setItem("tasks", JSON.stringify(tasks));

    // Display tasks, if any
    tasks.forEach((task) => addTask(task));
    filterTasks();
  }

  // Function to add tasks to local storage
  function saveTask(task) {
    const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    tasks.push(task);
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }

  // Function to load tasks from html and store it in local storage
  function updateLocalStorage() {
    const tasks = [];

    // Load tasks from html and store it in tasks array
    $("#tasks .task").each(function () {
      const text = $(this).find("p").text();
      const priority = $(this).find("span").eq(0).text().slice(0, -1);
      const deadline = $(this).find("span").eq(1).text().slice(0, -1);
      const state = $(this).find("span").eq(2).text();

      tasks.push({
        text: text,
        priority: priority,
        deadline: deadline,
        state: state,
      });
    });

    localStorage.setItem("tasks", JSON.stringify(tasks));
  }

  // Function to check if there are any tasks and filter the tasks
  function filterTasks() {
    const tasksNumber = $("#tasks .task").length;

    if (tasksNumber === 0) {
      $(".initial-para").text("You have not added any task yet.");
      $(".btn-outline-dark").addClass("d-none");
    } else {
      let hasVisibleTasks = false;

      $(".task").each(function () {
        const state = $(this).data("state");
        if (selectedFilter === "any" || selectedFilter === state) {
          $(this).show();
          hasVisibleTasks = true;
        } else {
          $(this).hide();
        }
      });

      if (!hasVisibleTasks) {
        $(".initial-para").text(
          `There are no tasks with '${selectedFilter}' status.`
        );
        $(".btn-outline-dark").addClass("d-none");
      } else {
        $(".initial-para").text("");
        $(".btn-outline-dark").removeClass("d-none");
      }
    }
  }
});
