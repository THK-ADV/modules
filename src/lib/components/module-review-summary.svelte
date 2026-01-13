<script lang="ts">
  import { goto } from '$app/navigation'
  import { CircleCheck, SquarePen, Eye, Gitlab, CircleX } from '@lucide/svelte'
  import ErrorMessage from './error-message.svelte'
  import Button from './ui/button/button.svelte'
  import Spinner from './ui/spinner/spinner.svelte'
  import { Textarea } from './ui/textarea'

  let {
    reviews,
    reviewInProgress = $bindable(),
    moduleId
  }: {
    reviews: { reviewId: string; role: string; studyProgram: string }[]
    reviewInProgress: boolean
    moduleId: string
  } = $props()

  const minRejectCommentLength = 10

  let errorMessage = $state(undefined)
  let reviewedStudyPrograms = $derived(new Array<boolean>(reviews.length).fill(false))
  let comment = $state('')
  let mrURLisLoading = $state(false)

  const commentLength = $derived(comment.trim().length)
  const canApprove = $derived(reviewedStudyPrograms.some((r) => r))
  const canReject = $derived(
    reviewedStudyPrograms.some((r) => r) && commentLength >= minRejectCommentLength
  )
  const hasSelectedReviews = $derived(reviewedStudyPrograms.some((r) => r))

  async function performAction(action: 'approve' | 'reject'): Promise<void> {
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
      errorMessage = err.message
    }
  }

  async function approve(): Promise<void> {
    if (!canApprove) return
    await performAction('approve')
  }

  async function reject(): Promise<void> {
    if (!canReject) return
    await performAction('reject')
  }

  async function openGitLabMR() {
    errorMessage = undefined
    mrURLisLoading = true
    const response = await fetch(`/actions/module-approval?moduleId=${moduleId}`)
    if (response.ok) {
      const url = await response.text()
      mrURLisLoading = false
      window.open(url, '_blank', 'noopener,noreferrer')
    } else {
      mrURLisLoading = false
      const err = await response.json()
      errorMessage = err.message
    }
  }
</script>

<ErrorMessage bind:message={errorMessage} />

<div class="rounded-md border-l-4 border-l-amber-400 bg-amber-50/50 p-4">
  <div class="ml-3 flex-1 space-y-5">
    <!-- Header -->
    <div class="flex items-start justify-between gap-4">
      <h3 class="text-foreground text-lg font-semibold">Prüfprozess</h3>
      <Button
        variant="outline"
        size="sm"
        onclick={openGitLabMR}
        disabled={mrURLisLoading}
        class="shrink-0"
      >
        {#if mrURLisLoading}
          <Spinner size="sm" class="mr-1" />
          Lädt…
        {:else}
          <Gitlab class="mr-1 size-4" />
          Änderungen auf GitLab anzeigen
        {/if}
      </Button>
    </div>

    <!-- Review Summary -->
    <div class="space-y-3 text-sm">
      <p class="text-foreground">
        Prüfen Sie alle hervorgehobenen Moduländerungen und geben Sie diese frei oder lehnen Sie
        diese mit einer Begründung ab.
      </p>
      <div class="flex flex-col gap-3 sm:flex-row sm:gap-6">
        <div class="flex items-center gap-2.5">
          <span
            class="inline-flex size-6 shrink-0 items-center justify-center rounded bg-amber-200 text-amber-900"
          >
            <Eye class="size-4" />
          </span>
          <span class="text-foreground text-sm"
            >Änderungen, die im Review geprüft werden müssen</span
          >
        </div>
        <div class="flex items-center gap-2.5">
          <span
            class="inline-flex size-6 shrink-0 items-center justify-center rounded bg-blue-200 text-blue-900"
          >
            <SquarePen class="size-4" />
          </span>
          <span class="text-foreground text-sm">Allgemeine Änderungen</span>
        </div>
      </div>
      <p class="text-muted-foreground text-xs">
        Weitere Hinweise zum Prüfprozess finden Sie in der
        <a
          href="/help#review-process"
          target="_blank"
          rel="noopener noreferrer"
          class="text-primary font-medium underline-offset-2 hover:underline">Hilfe</a
        >.
      </p>
    </div>

    <!-- Comment -->
    <div class="space-y-3">
      <label for="review-comment" class="text-foreground text-base font-medium">Kommentar</label>
      <Textarea
        id="review-comment"
        class="border-input bg-background w-full rounded-md border p-3 text-sm"
        placeholder="Kommentar verfassen…"
        bind:value={comment}
        aria-describedby="comment-hint"
        rows={4}
      />
      <p id="comment-hint" class="text-xs text-amber-800">
        Optional bei Zustimmung. Erforderlich bei Ablehnung (mind. {minRejectCommentLength} Zeichen).
      </p>
    </div>

    <!-- Reviews -->
    {#if reviews.length > 0}
      <div class="space-y-3">
        <p class="text-base font-medium">
          Review erteilen für:
          {#if hasSelectedReviews}
            <span class="ml-2 text-sm font-normal text-green-700">
              ({reviewedStudyPrograms.filter((r) => r).length} ausgewählt)
            </span>
          {/if}
        </p>
        <div class="flex flex-col space-y-2">
          {#each reviews as review, index (review.reviewId)}
            <label
              for={review.reviewId}
              class="flex cursor-pointer items-center gap-3 rounded-md border-2 px-4 py-3 transition-all"
              class:bg-amber-50={reviewedStudyPrograms[index]}
              class:bg-background={!reviewedStudyPrograms[index]}
              class:border-amber-600={reviewedStudyPrograms[index]}
              class:border-input={!reviewedStudyPrograms[index]}
              class:shadow-sm={reviewedStudyPrograms[index]}
              class:hover:border-amber-400={!reviewedStudyPrograms[index]}
            >
              <input
                id={review.reviewId}
                type="checkbox"
                class="border-input size-4 rounded text-amber-800 focus:ring-2 focus:ring-amber-600 focus:ring-offset-2"
                bind:checked={reviewedStudyPrograms[index]}
                aria-describedby="reviewed-hint"
              />
              <span class="text-foreground text-sm font-medium select-none">
                {review.studyProgram}
                <span class="text-muted-foreground ml-1 text-xs font-normal"
                  >(als {review.role})</span
                >
              </span>
            </label>
          {/each}
        </div>
      </div>
    {/if}

    <div class="flex flex-col gap-3 border-t border-amber-300/30 pt-4 sm:flex-row sm:justify-start">
      <Button
        variant="default"
        size="lg"
        disabled={!canApprove}
        onclick={approve}
        aria-disabled={!canApprove}
        class="flex w-full items-center justify-center gap-2 sm:w-auto"
        title={!canApprove ? 'Bitte wählen Sie mindestens einen Studiengang aus' : ''}
      >
        <CircleCheck class="size-4" />
        <span>Änderungen akzeptieren</span>
      </Button>

      <Button
        variant="destructive"
        size="lg"
        disabled={!canReject}
        onclick={reject}
        aria-disabled={!canReject}
        class="flex w-full items-center justify-center gap-2 sm:w-auto"
        title={!canReject
          ? !hasSelectedReviews
            ? 'Bitte wählen Sie mindestens einen Studiengang aus'
            : `Kommentar erforderlich (mind. ${minRejectCommentLength} Zeichen)`
          : ''}
      >
        <CircleX class="size-4" />
        <span>Änderungen ablehnen</span>
      </Button>
    </div>
  </div>
</div>
