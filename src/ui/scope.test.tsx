// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from '../App';

const nav = () => within(screen.getByRole('navigation', { name: 'Sections' }));
const guide = () => within(screen.getByRole('complementary', { name: 'Guided walkthrough' }));

async function startBlank(user: ReturnType<typeof userEvent.setup>) {
  render(<App />);
  await user.click(screen.getByRole('button', { name: /Start blank/ }));
  await user.click(nav().getByRole('button', { name: 'Profile' }));
}

describe('Scope', () => {
  it('turns modules off from the Profile scope answers and back on from the page', async () => {
    const user = userEvent.setup();
    await startBlank(user);
    const scope = within(screen.getByRole('article', { name: 'Scope' }));
    await user.selectOptions(scope.getByLabelText('Is it built with AI coding tools?'), 'no');

    const aiNav = nav().getByRole('button', { name: 'AI Development' });
    expect(aiNav).toHaveClass('off');
    expect(scope.getByRole('combobox', { name: 'AI Development: applies' })).toHaveDisplayValue(
      'Recommended: not applicable',
    );

    await user.click(aiNav);
    const notice = screen.getByRole('note');
    expect(notice).toHaveTextContent('Not applicable for this scope.');
    expect(notice).toHaveTextContent('costs entered here still count in TCO');
    await user.click(within(notice).getByRole('button', { name: 'Turn on' }));
    expect(nav().getByRole('button', { name: 'AI Development' })).not.toHaveClass('off');
    expect(screen.queryByText('Not applicable for this scope.')).toBeNull();
  });

  it('hides pages that do not apply, and shows them again', async () => {
    const user = userEvent.setup();
    await startBlank(user);
    const scope = within(screen.getByRole('article', { name: 'Scope' }));
    await user.selectOptions(
      scope.getByLabelText('Could you buy a commercial product instead?'),
      'no',
    );
    await user.selectOptions(scope.getByLabelText('Where is the initiative today?'), 'idea');
    await user.click(nav().getByRole('button', { name: 'Hide 2 not applicable' }));
    expect(nav().queryByRole('button', { name: 'Build vs Buy' })).toBeNull();
    expect(nav().queryByRole('button', { name: 'Actuals' })).toBeNull();
    await user.click(nav().getByRole('button', { name: 'Show 2 hidden pages' }));
    expect(nav().getByRole('button', { name: 'Actuals' })).toBeInTheDocument();
  });

  it('suggests value types for the application and claims them', async () => {
    const user = userEvent.setup();
    await startBlank(user);
    const scope = within(screen.getByRole('article', { name: 'Scope' }));
    await user.selectOptions(scope.getByLabelText('What data does it handle?'), 'regulated');
    await user.click(scope.getByRole('button', { name: 'Claim Compliance and audit readiness' }));
    expect(
      scope.getByRole('button', { name: 'Compliance and audit readiness is claimed' }),
    ).toBeDisabled();
    await user.click(nav().getByRole('button', { name: 'Benefits' }));
    expect(screen.getByRole('checkbox', { name: /Compliance and audit readiness/ })).toBeChecked();
  });

  it('flags missing essential costs and reports the scope', async () => {
    const user = userEvent.setup();
    await startBlank(user);
    const scope = within(screen.getByRole('article', { name: 'Scope' }));
    await user.selectOptions(scope.getByLabelText('Does it call AI models in production?'), 'core');
    await user.selectOptions(
      scope.getByLabelText('Could you buy a commercial product instead?'),
      'no',
    );
    await user.click(nav().getByRole('button', { name: 'Reports' }));
    expect(
      screen.getByText(
        'The app calls AI models in production, but monthly AI runtime cost is zero.',
      ),
    ).toBeInTheDocument();
    const report = within(screen.getByRole('article', { name: 'Scope' }));
    expect(report.getByText(/Left out:/).parentElement).toHaveTextContent(
      'Build vs Buy (No commercial product does the job.)',
    );
  });

  it('records the application questions from the walkthrough in the case', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /Start with the guide/ }));
    await user.selectOptions(guide().getByLabelText('Who uses it?'), 'customer');
    const ai = guide().getByRole('group', { name: /AI coding tools/ });
    await user.click(within(ai).getByRole('radio', { name: 'No' }));
    await user.click(guide().getByRole('button', { name: /Start walkthrough/ }));
    const outline = guide()
      .getByText(/All steps/)
      .closest('details')!;
    expect(within(outline).queryByText(/AI-assisted delivery/)).toBeNull();
    await user.click(guide().getByRole('button', { name: 'Close walkthrough' }));
    await user.click(nav().getByRole('button', { name: 'Profile' }));
    const scope = within(screen.getByRole('article', { name: 'Scope' }));
    expect(scope.getByLabelText('Who uses it?')).toHaveDisplayValue('Customers or partners');
    expect(scope.getByLabelText('Is it built with AI coding tools?')).toHaveDisplayValue('No');
    expect(nav().getByRole('button', { name: 'AI Development' })).toHaveClass('off');
  });
});
