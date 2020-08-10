$(function() {
  let chapters;
  let reverse_chapters;

  $.getJSON('/data/chapters.json', function(data) {
    // Set JSON data to variable
    chapters  = data;
  }).done(function() {
    // Sort chapters by experience ratio from highest to lowest
    chapters = chapters.sort(function(key_1, key_2) {
      return -(key_1.experience_ratio - key_2.experience_ratio);
    });
  });

  const $form        = $('#experience-form');
  const $tbody       = $('tbody');
  const $current_exp = $('#current-experience');
  const $max_exp     = $('#max-experience');
  const $ap          = $('#ap');

  $form.submit(function(e) {
    e.preventDefault();

    // Clear the table
    $tbody.html('');

    let remaining_exp = $max_exp.val() - $current_exp.val();
    let remaining_ap  = $ap.val();

    const user_exp_ratio          = remaining_exp / remaining_ap;
    let closest_exp_ratio_chapter = { "experience_ratio": 1_000_000 };

    insertTableRow($tbody, '<strong>Start</strong>', '-', `<strong>${remaining_exp}</strong>`, `<strong>${remaining_ap}</strong>`);

    $.each(chapters, function(index, chapter) {
      // We want the chapters with the lowest experience ratio that is HIGHER than the user's current experience ratio
      if(chapter.experience_ratio >= user_exp_ratio && closest_exp_ratio_chapter.experience_ratio >= chapter.experience_ratio) {
        closest_exp_ratio_chapter = chapter;
      }
    });

    if(closest_exp_ratio_chapter.experience_ratio == 1_000_000) {
      alert('We could not calculate a way for you to level up with these numbers.');
      return true;
    }

    // We repeat this chapter until the user's AP is about 2x the most efficient chapter
    while(remaining_ap > closest_exp_ratio_chapter.ap_cost * 2 && remaining_exp - closest_exp_ratio_chapter.experience_earned > 0) {
      remaining_exp -= closest_exp_ratio_chapter.experience_earned;
      remaining_ap  -= closest_exp_ratio_chapter.ap_cost;

      insertTableRow(
        $tbody,
        `Act ${closest_exp_ratio_chapter.act}, Chapter ${closest_exp_ratio_chapter.chapter}, ${closest_exp_ratio_chapter.act_difficulty}`,
        closest_exp_ratio_chapter.experience_ratio,
        `${remaining_exp} <span class="text-danger">(-${closest_exp_ratio_chapter.experience_earned})</span>`,
        `${remaining_ap} <span class="text-danger">(-${closest_exp_ratio_chapter.ap_cost})</span>`
      );
    }

    let final_chapter_found = false;

    // See if there is one last chapter with a high exp ratio that can wrap this up
    $.each(chapters, function(index, chapter) {
      if(chapter.experience_earned >= remaining_exp && chapter.ap_cost <= remaining_ap) {
        remaining_exp -= chapter.experience_earned;
        remaining_ap  -= chapter.ap_cost;

        final_chapter_found = true;

        insertTableRow(
          $tbody,
          `Act ${chapter.act}, Chapter ${chapter.chapter}, ${chapter.act_difficulty}`,
          chapter.experience_ratio,
          `${remaining_exp} <span class="text-danger">(-${chapter.experience_earned})</span>`,
          `${remaining_ap} <span class="text-danger">(-${chapter.ap_cost})</span>`
        );
      }

      // Break out of each loop if final chapter found
      if(final_chapter_found == true) {
        return false;
      }
    });
  });
});

function insertTableRow(tbody, chapter, exp_ratio, remaining_exp, remaining_ap) {
  tbody.append(`
    <tr>
      <td>${chapter}</td>
      <td class="text-right">${exp_ratio}</td>
      <td class="text-right">${remaining_exp}</td>
      <td class="text-right">${remaining_ap}</td>
    </tr>
  `);
};