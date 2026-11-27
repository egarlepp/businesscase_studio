// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from '../App';
import { GUIDE_STORAGE_KEY } from '../guide/storage';

const guide = () => within(screen.getByRole('complementary', { name: 'Guided walkthrough' }));
const eyebrow = (name: string) => screen.getByText(`BUSINESS CASE / ${name.toUpperCase()}`);

async function startAsCfo(user: ReturnType<typeof userEvent.setup>) {
  render(<App />);
  await user.click(screen.getByRole('button', { name: 'Start walkthrough' }));
  await user.click(guide().getByRole('radio', { name: 'CFO / Finance' }));
  await user.click(guide().getByRole('button', { name: /Start walkthrough/ }));
}

describe('Guided walkthrough', () => {
  it('invites first-time users and can be dismissed for good', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    expect(screen.getByRole('region', { name: 'Getting started' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Not now' }));
    expect(screen.queryByRole('region', { name: 'Getting started' })).toBeNull();
    unmount();
    render(<App />);
    expect(screen.queryByRole('region', { name: 'Getting started' })).toBeNull();
  });

  it('asks setup questions, then opens the first page with examples', async () => {
    const user = userEvent.setup();
    await startAsCfo(user);
    expect(eyebrow('Profile')).toBeInTheDocument();
    expect(guide().getByRole('heading', { name: /Name the initiative/ })).toBeInTheDocument();
    expect(guide().getByText('Key page for CFO / Finance')).toBeInTheDocument();
    expect(guide().getByText(/Ask Finance for the discount rate/)).toBeInTheDocument();
  });

  it('applies an example value to the model', async () => {
    const user = userEvent.setup();
    await startAsCfo(user);
    await user.click(
      guide().getByRole('button', { name: 'Use example for Application or initiative' }),
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Quote Approval Portal');
    expect(
      guide().getByRole('button', { name: 'Use example for Application or initiative' }),
    ).toBeDisabled();
  });

  it('moves page by page and resumes where the user left off', async () => {
    const user = userEvent.setup();
    await startAsCfo(user);
    await user.click(guide().getByRole('button', { name: /Done, next/ }));
    await user.click(guide().getByRole('button', { name: /Done, next/ }));
    expect(eyebrow('Benefits')).toBeInTheDocument();
    expect(guide().getByText(/Step 3 of/)).toBeInTheDocument();

    await user.click(guide().getByRole('button', { name: 'Close walkthrough' }));
    expect(screen.queryByRole('complementary', { name: 'Guided walkthrough' })).toBeNull();
    await user.click(
      within(screen.getByRole('navigation', { name: 'Sections' })).getByRole('button', {
        name: 'Overview',
      }),
    );
    await user.click(screen.getByRole('button', { name: 'Guide' }));
    expect(eyebrow('Benefits')).toBeInTheDocument();
    expect(guide().getByText(/All steps \(2 of \d+ done\)/)).toBeInTheDocument();
    expect(window.localStorage.getItem(GUIDE_STORAGE_KEY)).toContain('"audience":"cfo"');
  });

  it('tailors steps to the answers', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Start walkthrough' }));
    await user.click(guide().getByRole('radio', { name: 'CRO / Sales leader' }));
    await user.click(guide().getByRole('radio', { name: /Live in production/ }));
    const ai = guide().getByRole('group', { name: /AI coding tools/ });
    await user.click(within(ai).getByRole('radio', { name: 'No' }));
    await user.click(guide().getByRole('button', { name: /Start walkthrough/ }));
    const outline = guide()
      .getByText(/All steps/)
      .closest('details')!;
    expect(within(outline).getByText('Estimate revenue influence')).toBeInTheDocument();
    expect(within(outline).getByText('Track realized results')).toBeInTheDocument();
    expect(within(outline).queryByText(/AI-assisted delivery/)).toBeNull();
  });

  it('marks key pages in the nav and briefs the audience on Reports', async () => {
    const user = userEvent.setup();
    await startAsCfo(user);
    await user.click(guide().getByRole('button', { name: 'Close walkthrough' }));
    const nav = within(screen.getByRole('navigation', { name: 'Sections' }));
    expect(nav.getAllByText('Key page for CFO / Finance').length).toBeGreaterThan(0);
    await user.click(nav.getByRole('button', { name: /^Reports/ }));
    const briefing = screen.getByRole('article', { name: 'Audience briefing' });
    expect(within(briefing).getByText('Lead with Conservative.')).toBeInTheDocument();
    expect(within(briefing).getByText(/Is time saved real money/)).toBeInTheDocument();
  });
});
