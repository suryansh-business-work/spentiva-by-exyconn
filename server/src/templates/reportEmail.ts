import mjml2html from 'mjml';

interface ReportData {
  userName: string;
  dateRange: string;
  totalExpenses: number;
  averageExpense: number;
  transactionCount: number;
  categoryData: Array<{
    category: string;
    total: number;
    count: number;
  }>;
  monthlyData: Array<{
    month: number;
    total: number;
  }>;
}

export const generateReportEmail = (data: ReportData): string => {
  const mjml = `
    <mjml>
      <mj-head>
        <mj-title>Expense Report - ${data.dateRange}</mj-title>
        <mj-font name="Inter" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" />
        <mj-attributes>
          <mj-all font-family="Inter, Arial, sans-serif" />
          <mj-text font-size="14px" color="#374151" line-height="1.6" />
          <mj-section padding="0" />
        </mj-attributes>
        <mj-style>
          .stat-value { font-size: 32px; font-weight: 700; color: #1f2937; margin: 0; }
          .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
          .category-row { border-bottom: 1px solid #e5e7eb; }
          .progress-bar { background: #e5e7eb; border-radius: 8px; overflow: hidden; height: 8px; }
        </mj-style>
      </mj-head>
      
      <mj-body background-color="#f3f4f6">
        <!-- Header -->
        <mj-section background-color="#ffffff" padding="40px 20px">
          <mj-column>
            <mj-text align="center" font-size="32px" font-weight="700" color="#845c58">
              expensia
            </mj-text>
            <mj-text align="center" font-size="16px" color="#6b7280" padding-top="10px">
              Expense Report
            </mj-text>
          </mj-column>
        </mj-section>

        <!-- Greeting -->
        <mj-section background-color="#ffffff" padding="20px 40px">
          <mj-column>
            <mj-text font-size="18px" font-weight="600" color="#1f2937">
              Hello ${data.userName},
            </mj-text>
            <mj-text padding-top="10px">
              Here's your expense report for <strong>${data.dateRange}</strong>. This summary provides insights into your spending patterns.
            </mj-text>
          </mj-column>
        </mj-section>

        <!-- Summary Cards -->
        <mj-section background-color="#ffffff" padding="20px 40px">
          <mj-group>
            <mj-column width="33.33%" background-color="#f9fafb" border-radius="8px" padding="20px">
              <mj-text css-class="stat-label" align="center">TOTAL EXPENSES</mj-text>
              <mj-text css-class="stat-value" align="center" padding-top="10px">₹${data.totalExpenses.toLocaleString('en-IN')}</mj-text>
            </mj-column>
            <mj-column width="33.33%" background-color="#f9fafb" border-radius="8px" padding="20px">
              <mj-text css-class="stat-label" align="center">AVERAGE</mj-text>
              <mj-text css-class="stat-value" align="center" padding-top="10px">₹${Math.round(data.averageExpense).toLocaleString('en-IN')}</mj-text>
            </mj-column>
            <mj-column width="33.33%" background-color="#f9fafb" border-radius="8px" padding="20px">
              <mj-text css-class="stat-label" align="center">TRANSACTIONS</mj-text>
              <mj-text css-class="stat-value" align="center" padding-top="10px">${data.transactionCount}</mj-text>
            </mj-column>
          </mj-group>
        </mj-section>

        <!-- Category Breakdown -->
        <mj-section background-color="#ffffff" padding="40px 40px 20px">
          <mj-column>
            <mj-text font-size="20px" font-weight="700" color="#1f2937">
              Expenses by Category
            </mj-text>
          </mj-column>
        </mj-section>

        ${data.categoryData.map((category, index) => {
          const percentage = (category.total / data.totalExpenses) * 100;
          return `
            <mj-section background-color="#ffffff" padding="${index === 0 ? '20px 40px 10px' : '10px 40px'}">
              <mj-column width="70%">
                <mj-text font-weight="600" color="#1f2937" padding-bottom="5px">
                  ${category.category}
                </mj-text>
                <mj-text font-size="12px" color="#6b7280" padding-bottom="10px">
                  ${category.count} transactions
                </mj-text>
              </mj-column>
              <mj-column width="30%">
                <mj-text align="right" font-weight="700" color="#845c58" font-size="16px">
                  ₹${category.total.toLocaleString('en-IN')}
                </mj-text>
                <mj-text align="right" font-size="12px" color="#6b7280">
                  ${percentage.toFixed(1)}%
                </mj-text>
              </mj-column>
            </mj-section>
            <mj-section background-color="#ffffff" padding="0px 40px 15px">
              <mj-column>
                <mj-raw>
                  <div class="progress-bar">
                    <div style="width: ${percentage}%; background: linear-gradient(135deg, #845c58 0%, #b7bac3 100%); height: 100%;"></div>
                  </div>
                </mj-raw>
              </mj-column>
            </mj-section>
          `;
        }).join('')}

        <!-- Monthly Trend -->
        ${data.monthlyData.length > 0 ? `
        <mj-section background-color="#ffffff" padding="40px 40px 20px">
          <mj-column>
            <mj-text font-size="20px" font-weight="700" color="#1f2937">
              Monthly Trend
            </mj-text>
          </mj-column>
        </mj-section>

        <mj-section background-color="#ffffff" padding="20px 40px">
          <mj-column>
            <mj-table>
              <tr style="border-bottom: 2px solid #e5e7eb; text-align: left;">
                <th style="padding: 10px; font-weight: 600; color: #6b7280; font-size: 12px; text-transform: uppercase;">Month</th>
                <th style="padding: 10px; font-weight: 600; color: #6b7280; font-size: 12px; text-transform: uppercase; text-align: right;">Amount</th>
              </tr>
              ${data.monthlyData.filter(m => m.total > 0).map(month => {
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                return `
                  <tr style="border-bottom: 1px solid #f3f4f6;">
                    <td style="padding: 12px; color: #374151;">${monthNames[month.month - 1]}</td>
                    <td style="padding: 12px; color: #845c58; font-weight: 600; text-align: right;">₹${month.total.toLocaleString('en-IN')}</td>
                  </tr>
                `;
              }).join('')}
            </mj-table>
          </mj-column>
        </mj-section>
        ` : ''}

        <!-- Call to Action -->
        <mj-section background-color="#ffffff" padding="40px">
          <mj-column>
            <mj-button 
              background-color="#845c58" 
              color="#ffffff" 
              font-weight="600"
              border-radius="8px"
              padding="15px 40px"
              href="http://localhost:3000/trackers"
            >
              View Full Dashboard
            </mj-button>
          </mj-column>
        </mj-section>

        <!-- Footer -->
        <mj-section background-color="#f9fafb" padding="30px 40px">
          <mj-column>
            <mj-text align="center" font-size="12px" color="#6b7280">
              This is an automated report from expensia
            </mj-text>
            <mj-text align="center" font-size="12px" color="#6b7280" padding-top="5px">
              © ${new Date().getFullYear()} expensia. All rights reserved.
            </mj-text>
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>
  `;

  const result = mjml2html(mjml);
  return result.html;
};
