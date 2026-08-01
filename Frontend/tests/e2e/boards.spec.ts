import { test, expect } from '@playwright/test'

test.describe('Board Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'Test123!@#')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('should create a new board', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Click create board button
    await page.click('button:has-text("Create Board")')
    
    // Fill board details
    await page.fill('input[name="name"]', 'Test Board E2E')
    await page.fill('textarea[name="description"]', 'Test Description')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Verify board was created
    await page.waitForURL('/boards/')
    await expect(page.locator('h1')).toContainText('Test Board E2E')
  })

  test('should add a list to board', async ({ page }) => {
    // Navigate to existing board
    await page.goto('/boards/board-id')
    
    // Add new list
    await page.fill('input[placeholder="Enter list title..."]', 'New List')
    await page.click('button:has-text("Add List")')
    
    // Verify list was added
    await expect(page.locator('text=New List')).toBeVisible()
  })

  test('should add a card to list', async ({ page }) => {
    await page.goto('/boards/board-id')
    
    // Add new card
    await page.fill('input[placeholder="Enter card title..."]', 'New Card')
    await page.click('button:has-text("Add Card")')
    
    // Verify card was added
    await expect(page.locator('text=New Card')).toBeVisible()
  })

  test('should open card modal', async ({ page }) => {
    await page.goto('/boards/board-id')
    
    // Click on card
    await page.click('text=New Card')
    
    // Verify modal opened
    await expect(page.locator('[role="dialog"]')).toBeVisible()
    await expect(page.locator('input[placeholder="Card title"]')).toBeVisible()
  })

  test('should add comment to card', async ({ page }) => {
    await page.goto('/boards/board-id')
    
    // Open card modal
    await page.click('text=New Card')
    
    // Switch to comments tab
    await page.click('text=Comments')
    
    // Add comment
    await page.fill('input[placeholder="Write a comment..."]', 'Test comment')
    await page.click('button:has-text("Comment")')
    
    // Verify comment was added
    await expect(page.locator('text=Test comment')).toBeVisible()
  })

  test('should add checklist to card', async ({ page }) => {
    await page.goto('/boards/board-id')
    
    // Open card modal
    await page.click('text=New Card')
    
    // Switch to checklists tab
    await page.click('text=Checklists')
    
    // Add checklist
    await page.fill('input[placeholder="Add a checklist..."]', 'Test Checklist')
    await page.click('button:has-text("Add")')
    
    // Verify checklist was added
    await expect(page.locator('text=Test Checklist')).toBeVisible()
  })

  test('should update card details', async ({ page }) => {
    await page.goto('/boards/board-id')
    
    // Open card modal
    await page.click('text=New Card')
    
    // Update title
    const titleInput = page.locator('input[placeholder="Card title"]')
    await titleInput.clear()
    await titleInput.fill('Updated Card Title')
    
    // Update description
    const descInput = page.locator('textarea[placeholder="Add a description..."]')
    await descInput.fill('Updated description')
    
    // Close modal (auto-save on blur)
    await page.click('button[aria-label="Close"]')
    
    // Verify updates
    await page.waitForURL('/boards/board-id')
    await expect(page.locator('text=Updated Card Title')).toBeVisible()
  })

  test('should delete card', async ({ page }) => {
    await page.goto('/boards/board-id')
    
    // Open card modal
    await page.click('text=New Card')
    
    // Click delete button
    await page.click('button:has-text("Delete Card")')
    
    // Confirm deletion
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Are you sure')
      await dialog.accept()
    })
    
    // Verify card was deleted
    await expect(page.locator('text=New Card')).not.toBeVisible()
  })

  test('should archive board', async ({ page }) => {
    await page.goto('/boards/board-id')
    
    // Open menu
    await page.click('button[aria-label="More options"]')
    
    // Click archive
    await page.click('text=Archive')
    
    // Verify redirect to dashboard
    await page.waitForURL('/dashboard')
  })

  test('should search for cards', async ({ page }) => {
    // Use keyboard shortcut or navigate to search
    await page.keyboard.press('Meta+k')
    
    // Enter search query
    await page.fill('input[placeholder="Search..."]', 'Test')
    
    // Verify search results
    await expect(page.locator('text=Test Board E2E')).toBeVisible()
  })

  test('should receive real-time notifications', async ({ page }) => {
    // Open notification bell
    await page.click('[aria-label="Notifications"]')
    
    // Verify notification panel opened
    await expect(page.locator('text=Notifications')).toBeVisible()
  })

  test('should update profile', async ({ page }) => {
    await page.goto('/profile')
    
    // Update name
    await page.fill('input[name="name"]', 'Updated Name')
    
    // Save changes
    await page.click('button:has-text("Save")')
    
    // Verify success message
    await expect(page.locator('text=Profile updated')).toBeVisible()
  })

  test('should change theme', async ({ page }) => {
    await page.goto('/settings')
    
    // Toggle dark mode
    await page.click('button[aria-label="Toggle theme"]')
    
    // Verify theme changed
    await expect(page.locator('html')).toHaveClass(/dark/)
  })

  test('should access admin dashboard', async ({ page }) => {
    await page.goto('/admin')
    
    // Verify admin dashboard loaded
    await expect(page.locator('text=Admin Dashboard')).toBeVisible()
    await expect(page.locator('text=Users')).toBeVisible()
    await expect(page.locator('text=Activities')).toBeVisible()
  })
})