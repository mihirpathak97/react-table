/**
 * @FunctionComponent ReactTable
 */

import * as React from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'

/**
 * The component's props
 * @typedef OwnProps
 * @property {array} data - Specifies the data to populate the table with
 * @property {array} columns - Specifies the columns to display
 * @property {array} filters - Optional prop to specify filtets
 * @property {string} rowKey - Specifies the unique key for each row. Appended with `index`
 * @property {boolean} loading - Specifies if the table is in loading state. Will show a generic loading UI
 * @property {boolean} showClearFilters - Optional prop to show the `clear filters` button. Defaults to true
 * @property {Pagination} pagination - Optional prop to pass pagination config
 */
interface OwnProps {
  data: Array<Object>,
  columns: Array<Column>,
  filters?: Array<Filter>,
  rowKey?: string,
  loading?: boolean,
  showGlobalSearch?: boolean,
  showClearFilters?: boolean,
  pagination?: Pagination
}

/**
 * A column
 * @typedef Column
 * @property {string} title - Specifies column title
 * @property {string} key - A unique key that will be used as `key` in React
 * @property {string} dataIndex - The key to find in data passed
 * @property {boolean} visible - Specifies if column is visible. Accepts falsy values
 * @property {func} render - A custom render function for column
 */
interface Column {
  title: string,
  key: string,
  dataIndex: string,
  visible?: boolean,
  render?: Function
}

/**
 * A filter
 * @typedef Filter
 * @property {string} label - Specifies filter label
 * @property {string} data - Array to specifiy data for `select`
 * @property {string} type - Type of filter. One of [select, input, toggle]
 * @property {string} dataIndex - Specifies which key to filter
 * @property {string} placeholder - Input placeholder
 * @property {Function} onFilterChange - An optional callback that will be triggered when filter value changes
 */
interface Filter {
  label?: string,
  data?: Array<any>,
  type: string,
  dataIndex: string,
  placeholder?: string,
  onFilterChange?: Function,
  render?: Function
}

/**
 * Same like filter, but will hold only type
 * @typedef FilterType
 * @property {string} type - Type of filter. One of [select, input, toggle]
 */
interface FilterType {
  type: string
}

interface Pagination {
  currentPage: number,
  pageLength: number,
  onChange: Function
}

const FilterWrapper = styled.div`
  display: flex;
  width: 80%;
  height: auto;
  margin: auto;
  flex-direction: row;
  justify-content: flex-start;
`

const FilterItem = styled.div`
  padding: 10px;
  margin: 10px 20px;
`

const Select = styled.select`
  padding: 10px;
  min-width: 6rem;
`

const Pagination = styled.div`
  position: relative;
  right: 0;
`

const ReactTable: React.FunctionComponent<OwnProps> = ({
  data,
  columns,
  filters,
  rowKey,
  loading,
  showGlobalSearch = false,
  showClearFilters = true,
  pagination = {
    currentPage: 1,
    pageLength: 50,
    onChange: () => { }
  }
}) => {

  const [renderData, setData] = React.useState<Array<Object>>([])
  const [localColumns, setColumns] = React.useState<Array<Column>>([])
  const [appliedFilters, setAppliedFilters] = React.useState<Object>({})
  const [filterValues, setFilterValues] = React.useState<Object>({})
  const [pageData, setPageData] = React.useState<Pagination>(pagination)

  React.useEffect(() => {
    setData(data)
    setColumns(columns)
  }, [data, columns])

  React.useEffect(() => {
    setData(data.filter((item: Object) => {
      return Object.keys(appliedFilters).every(filter => {
        let filterData: FilterType = getFilters().filter(item => item.dataIndex === filter)[0]
        let appliedFilter = appliedFilters[filter]

        if (!filterData) {
          filterData = {
            type: 'globalSearch',
          }
        }

        switch (String(filterData.type)) {
          case 'select':
            return String(item[filter]) === String(appliedFilter)
          case 'input':
            return String(item[filter]).toLowerCase().includes(String(appliedFilter).toLowerCase())
          case 'toggle':
            return !!item[filter] === Boolean(appliedFilter)
          default:
            return Object.keys(item).some((key) => {
              // TODO - Currently global search also filters invisible columns
              // might have to rewrite the filter logic to accomodate this use case
              return String(item[key]).toLowerCase().includes(String(appliedFilter.toLowerCase()));
            });
        }
      })
    }))
  }, [appliedFilters])

  let handleFilterChange = (filterValue: string | boolean, key: string) => {
    let filterData: Filter = getFilters().filter(item => item.dataIndex === key)[0]
    setFilterValues(prevFilters => {
      return { ...prevFilters, [key]: filterValue }
    })

    /**
     * If there is a handler for filter provided,
     * this will trigger that function, otherwise
     * we will go ahead with the default filter logic
     */
    filterData.onFilterChange
      ? filterData.onFilterChange(filterValue, key, { ...filterValues, [key]: filterValue }) :
      setAppliedFilters(prevFilters => {
        return { ...prevFilters, [key]: filterValue }
      })
  }

  /**
   * Returns the filters prop passed by the parent or an empty
   * array if unavailable.
   */
  let getFilters = () => filters || []

  /**
   * Returns the row key prop if available or will try to find 
   * a `key` in item. Returns null otherwise
   * @param {Object} item
   */
  let getRowKey = (item: Object) => rowKey ? item[rowKey] : item['key'] ? item['key'] : null

  let clearFilters = () => {
    setAppliedFilters({})
    setFilterValues({})
  }

  /**
   * Parses the data by forcefully typecasting them as String.
   * @param data - The data to parse
   */
  let parseData = (data: any) => {
    return typeof data === 'boolean' ? data === true ? 'True' : 'False' : String(data)
  }


  /**
   * This will contain the visible set of data depending on the pagination config
   * @type {Array<Object>}
   */
  let paginatedData: Array<Object> = renderData.slice((pageData.currentPage - 1) * pageData.pageLength, pageData.pageLength * pageData.currentPage)

  /**
   * Set the current page number.
   * This will trigger the `paginatedData` variable to be updated
   * and cause a re-render.
   * @param {number} page
   */
  let setPageNumber = (page: number) => {
    setPageData(oldPageData => {
      return {
        ...oldPageData,
        currentPage: page
      }
    })
  }

  const Table = styled.table`
    display: block;
    margin: auto;
    max-width: 90%;
    min-width: 80%;
  `

  const Row = styled.tr`
    width: 100%;
  `

  const Head = styled.thead`
    width: 100%;
  `

  const Body = styled.tbody`
    width: 100%;
  `

  const Col = styled.td`
    width: ${100 / columns.length}%;
    padding: 10px 20px;
  `

  if (loading) {
    return (
      <>
        Loading please wait...
      </>
    )
  }

  return (
    <>
      <FilterWrapper>
        {
          getFilters().map((filter: Filter) => {
            if (filter.type === 'select') {
              return (
                <FilterItem key={`filter-select-${filter.dataIndex}`}>
                  <Select onChange={(event) => handleFilterChange(event.target.value, filter.dataIndex)} value={filterValues[filter.dataIndex] || ''}>
                    <option value="" disabled>{filter.placeholder ? filter.placeholder : 'Select and option'}</option>
                    {
                      filter.data ? filter.data.map((item, index) => {
                        return <option key={`${filter.dataIndex}-${item}-${index}`}>{item}</option>
                      }) : null
                    }
                  </Select>
                </FilterItem>
              )
            }
            if (filter.type === 'input') {
              return (
                <FilterItem key={`filter-input-${filter.dataIndex}`}>
                  <label>{filter.label}</label>{' '}
                  <input type="text" onChange={(event) => handleFilterChange(event.target.value, filter.dataIndex)} value={filterValues[filter.dataIndex] || ''} />
                </FilterItem>
              )
            }
            if (filter.type === 'toggle') {
              typeof filter.render === 'function' ? filter.render(item[column.dataIndex], item)
                            : parseData(item[column.dataIndex])
              return (
                <FilterItem key={`filter-toggle-${filter.dataIndex}`}>
                  <input type="checkbox" onChange={(event) => handleFilterChange(event.target.checked, filter.dataIndex)} checked={filterValues[filter.dataIndex] || false} />
                  <label>{filter.label}</label>
                </FilterItem>
              )
            }
            else {
              return (<></>)
            }
          })
        }
        {
          showGlobalSearch ? (
            <FilterItem key={`filter-input-global`}>
              <label>Global Search</label>{' '}
              <input type="text" onChange={(event) => handleFilterChange(event.target.value, 'globalSearch')} value={filterValues['globalSearch'] || ''} />
            </FilterItem>
          ) : null
        }
        {
          showClearFilters && (filters || showGlobalSearch) ? (
            <FilterItem key={`filter-clear`}>
              <button onClick={clearFilters}>Clear Filters</button>
            </FilterItem>
          ) : null
        }
      </FilterWrapper>
      <Table>
        <Head>
          <Row>
            {
              localColumns.map((column: Column) => {
                if (column.visible !== false)
                  return <Col key={`${column.key}`}>{column.title || column.dataIndex}</Col>
                return <></>
              })
            }
          </Row>
        </Head>
        <Body>
          {
            paginatedData.map((item: Object, index) => {
              return (
                <Row key={`${getRowKey(item)}-${index}`}>
                  {
                    localColumns.map((column: Column, index) => {
                      if (column.visible !== false)
                        return <Col key={`${column.key}-${index}`}>{
                          typeof column.render === 'function' ? column.render(item[column.dataIndex], item)
                            : parseData(item[column.dataIndex])
                        }</Col>
                      return <></>
                    })
                  }
                </Row>
              )
            })
          }
        </Body>
      </Table>
      {
        renderData.length > pagination.pageLength ? (
          <Pagination>
            <p>
              {
                Array.from(Array(Math.floor(renderData.length / pagination.pageLength)).keys()).map((pageNumber: number) => {
                  return <span key={`page-${pageNumber}`} onClick={() => { setPageNumber(pageNumber + 1) }}>{` ${pageNumber + 1} `}</span>
                })
              }
            </p>
          </Pagination>
        ) : null
      }
    </>
  )
}

ReactTable.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  columns: PropTypes.arrayOf(PropTypes.object).isRequired,
  filters: PropTypes.arrayOf(PropTypes.object),
  rowKey: PropTypes.string,
  loading: PropTypes.bool,
  showGlobalSearch: PropTypes.bool,
  showClearFilters: PropTypes.bool,
  pagination: PropTypes.object
}

export default ReactTable
