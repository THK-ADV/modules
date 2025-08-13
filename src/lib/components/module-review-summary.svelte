<script lang="ts">
  import { goto } from '$app/navigation'
  import { error } from '@sveltejs/kit'
  import Button from './ui/button/button.svelte'
  import { Textarea } from './ui/textarea'

  let {
    reviews,
    reviewInProgress = $bindable()
  }: {
    reviews: { reviewId: string; role: string; studyProgram: string }[]
    reviewInProgress: boolean
  } = $props()

  let reviewedStudyPrograms = $state(new Array(reviews.length).fill(false) as boolean[])
  let comment = $state('')

  const minRejectCommentLength = 10
  const canApprove = $derived.by(() => reviewedStudyPrograms.some((r) => r))
  const canReject = $derived.by(
    () => reviewedStudyPrograms.some((r) => r) && comment.trim().length >= minRejectCommentLength
  )

  async function handleAction(action: 'approve' | 'reject'): Promise<void> {
    reviewInProgress = true
    const response = await fetch('/actions/module-approval', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action,
        comment: comment.trim(),
        reviews: reviews.filter((_, index) => reviewedStudyPrograms[index])
      })
    })

    reviewInProgress = false

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        goto(`/module-approvals?approved=${action === 'approve'}`)
      }
    } else {
      const err = await response.json()
      throw error(response.status, err.message)
    }
  }

  async function handleApprove(): Promise<void> {
    if (!canApprove) return
    await handleAction('approve')
  }

  async function handleReject(): Promise<void> {
    if (!canReject) return
    await handleAction('reject')
  }
</script>

<!-- TODO: align UI with keys explanation and error / update component -->

<div class="rounded-md border-l-4 border-l-amber-400 bg-amber-50/50 p-4">
  <div class="ml-3 flex-1 space-y-4">
    <h3 class="text-lg font-semibold text-foreground">Prüfprozess</h3>
    <div class="space-y-2 text-sm">
      <p>Prüfen Sie alle hervorgehobenen Änderungen auf dieser Seite.</p>
      <ul class="list-disc space-y-1 pl-5">
        <li>Gelb: Änderungen, die im Review geprüft werden müssen.</li>
        <li>Blau: allgemeine Änderungen.</li>
      </ul>
    </div>

    <div class="space-y-2">
      <label for="review-comment" class="text-base font-medium">Kommentar</label>
      <Textarea
        id="review-comment"
        class="w-full rounded-md border border-input bg-background p-2 text-sm md:max-w-2xl"
        placeholder="Kommentar verfassen…"
        bind:value={comment}
        aria-describedby="comment-hint"
      />
      <p id="comment-hint" class="text-sm text-amber-800">
        Optional bei Zustimmung. Erforderlich bei Ablehnung (mind. {minRejectCommentLength} Zeichen).
      </p>
    </div>

    {#if reviews.length > 0}
      <div class="space-y-2">
        <p class="text-base font-medium">Review erteilen für:</p>
        <div class="flex flex-col space-y-2">
          {#each reviews as review, index (review.reviewId)}
            <div class="flex items-center gap-2">
              <input
                id={review.reviewId}
                type="checkbox"
                class="h-4 w-4 rounded border-input text-amber-800 focus:ring-amber-600"
                bind:checked={reviewedStudyPrograms[index]}
                aria-describedby="reviewed-hint"
              />
              <label for={review.reviewId} class="select-none text-sm">
                {review.studyProgram} (als {review.role})
              </label>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <div class="flex flex-col gap-2 pt-1 lg:flex-row lg:justify-start">
      <Button
        variant="destructive"
        disabled={!canReject}
        onclick={handleReject}
        aria-disabled={!canReject}
      >
        Änderungen ablehnen und Überarbeitung anfordern
      </Button>
      <Button
        variant="default"
        disabled={!canApprove}
        onclick={handleApprove}
        aria-disabled={!canApprove}
      >
        Änderungen akzeptieren und Review abschließen
      </Button>
    </div>
  </div>
</div>
